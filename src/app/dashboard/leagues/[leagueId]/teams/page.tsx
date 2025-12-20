'use client';

/**
 * PitchConnect League Teams Management Page - v2.0 ENHANCED
 * Location: ./src/app/dashboard/leagues/[leagueId]/teams/page.tsx
 *
 * Features:
 * ✅ Team management dashboard with statistics
 * ✅ Teams in league display (color-coded cards)
 * ✅ Available teams with invite functionality
 * ✅ Pending invitations tracking with cancel option
 * ✅ Search and filter teams by name, club, city
 * ✅ Team removal functionality with confirmation
 * ✅ Invite modal with optional message
 * ✅ Registration status awareness (open/closed/full)
 * ✅ Custom toast notifications (zero dependencies)
 * ✅ Loading and error states
 * ✅ Dark mode support
 * ✅ Responsive grid layouts
 * ✅ Schema-aligned data models
 * ✅ Full TypeScript type safety
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  Shield,
  Search,
  X,
  Check,
  Clock,
  Send,
  Trash2,
  UserPlus,
  MapPin,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// TYPES - SCHEMA-ALIGNED
// ============================================================================

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  category: string;
  club: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  isInLeague: boolean;
  joinedAt?: string;
}

interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  message?: string;
}

interface League {
  id: string;
  name: string;
  code: string;
  sport: string;
  configuration?: {
    maxTeams?: number;
    registrationOpen: boolean;
  };
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============================================================================
// TOAST COMPONENT (No External Dependency)
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
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
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
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => onRemove(toast.id)}
      />
    ))}
  </div>
);

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'gold' | 'orange' | 'blue';
}) => {
  const colorMap = {
    gold: 'bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800 transition-all hover:shadow-md dark:hover:shadow-charcoal-900/30">
      <div className="flex flex-col items-center text-center">
        <div className={`rounded-xl p-3 mb-3 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mb-1">
          {label}
        </p>
        <p className="text-3xl font-bold text-charcoal-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

const Badge = ({
  children,
  variant = 'default',
  color = 'neutral',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  color?: 'gold' | 'green' | 'orange' | 'neutral' | 'red';
}) => {
  const colorMap = {
    default: {
      gold: 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 border-gold-300 dark:border-gold-600',
      green:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600',
      orange:
        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600',
      neutral:
        'bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600',
    },
    outline: {
      gold: 'border-gold-300 dark:border-gold-600 text-gold-700 dark:text-gold-300',
      green: 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-300',
      orange: 'border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300',
      neutral: 'border-neutral-300 dark:border-charcoal-600 text-charcoal-700 dark:text-charcoal-300',
      red: 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-300',
    },
  };

  const baseClasses =
    'inline-block rounded-full px-3 py-1 text-xs font-semibold border';
  const variantClasses =
    variant === 'outline'
      ? `border ${colorMap.outline[color]}`
      : `border ${colorMap.default[color]}`;

  return <span className={`${baseClasses} ${variantClasses}`}>{children}</span>;
};

// ============================================================================
// TEAM CARD COMPONENT (In League)
// ============================================================================

const TeamInLeagueCard = ({
  team,
  onRemove,
  isRemoving,
}: {
  team: Team;
  onRemove: (id: string, name: string) => void;
  isRemoving: boolean;
}) => {
  return (
    <div className="rounded-lg border-2 border-green-200 bg-green-50 shadow-sm dark:border-green-700 dark:bg-green-900/10">
      <div className="p-6">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-charcoal-900 dark:text-white">
                {team.name}
              </p>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                {team.club.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => onRemove(team.id, team.name)}
            disabled={isRemoving}
            className="rounded-lg p-2 text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-charcoal-500 dark:text-charcoal-400" />
          <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
            {team.club.city}, {team.club.country}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <Badge color="green">{team.ageGroup}</Badge>
          <Badge variant="outline" color="neutral">
            {team.category.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TEAM CARD COMPONENT (Available)
// ============================================================================

const AvailableTeamCard = ({
  team,
  onInvite,
  isDisabled,
}: {
  team: Team;
  onInvite: (team: Team) => void;
  isDisabled: boolean;
}) => {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm transition-all hover:shadow-md dark:border-charcoal-700 dark:bg-charcoal-700">
      <div className="p-6">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30">
            <Shield className="h-6 w-6 text-gold-600 dark:text-gold-400" />
          </div>
          <div>
            <p className="font-bold text-charcoal-900 dark:text-white">
              {team.name}
            </p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
              {team.club.name}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-charcoal-500 dark:text-charcoal-400" />
          <span className="text-sm text-charcoal-600 dark:text-charcoal-400">
            {team.club.city}, {team.club.country}
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Badge color="gold">{team.ageGroup}</Badge>
          <Badge variant="outline" color="neutral">
            {team.category.replace(/_/g, ' ')}
          </Badge>
        </div>

        <button
          onClick={() => onInvite(team)}
          disabled={isDisabled}
          className="w-full rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="mr-2 inline-block h-4 w-4" />
          Invite to League
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// INVITATION ITEM COMPONENT
// ============================================================================

const InvitationItem = ({
  invitation,
  onCancel,
}: {
  invitation: Invitation;
  onCancel: (id: string) => void;
}) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-charcoal-600 dark:bg-charcoal-700">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100 dark:bg-gold-900/30">
          <Send className="h-5 w-5 text-gold-600 dark:text-gold-400" />
        </div>
        <div>
          <p className="font-semibold text-charcoal-900 dark:text-white">
            {invitation.teamName}
          </p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
            Invited {new Date(invitation.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" color="gold">
          {invitation.status}
        </Badge>
        <button
          onClick={() => onCancel(invitation.id)}
          className="rounded-lg p-2 text-charcoal-600 transition-all hover:bg-neutral-200 dark:text-charcoal-400 dark:hover:bg-charcoal-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function TeamsManagementPage() {
  const router = useRouter();
  const params = useParams();
  const leagueId = params.leagueId as string;

  // State Management
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
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
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    fetchLeagueData();
    fetchInvitations();
  }, [leagueId]);

  const fetchLeagueData = async () => {
    try {
      setIsLoading(true);

      const leagueRes = await fetch(`/api/leagues/${leagueId}`);
      if (!leagueRes.ok) throw new Error('Failed to fetch league');
      const leagueData = await leagueRes.json();
      setLeague(leagueData);

      const teamsRes = await fetch(`/api/leagues/${leagueId}/available-teams`);
      if (!teamsRes.ok) throw new Error('Failed to fetch teams');
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams || []);
    } catch (error) {
      console.error('Error fetching league data:', error);
      showToast('Failed to load league data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invitations`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleOpenInviteModal = (team?: Team) => {
    if (team) {
      setSelectedTeam(team);
    }
    setShowInviteModal(true);
  };

  const handleSendInvitation = async () => {
    if (!selectedTeam) return;

    setIsSendingInvite(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          message: invitationMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      showToast(`✅ Invitation sent to ${selectedTeam.name}`, 'success');
      setShowInviteModal(false);
      setSelectedTeam(null);
      setInvitationMessage('');
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to send invitation',
        'error'
      );
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (
      !window.confirm('Are you sure you want to cancel this invitation?')
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/leagues/${leagueId}/invitations/${invitationId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to cancel invitation');

      showToast('Invitation cancelled', 'success');
      fetchInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      showToast('Failed to cancel invitation', 'error');
    }
  };

  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${teamName} from the league?`
      )
    ) {
      return;
    }

    setRemovingTeamId(teamId);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove team');

      showToast(`${teamName} removed from league`, 'success');
      fetchLeagueData();
    } catch (error) {
      console.error('Error removing team:', error);
      showToast('Failed to remove team', 'error');
    } finally {
      setRemovingTeamId(null);
    }
  };

  // ========================================================================
  // FILTERS AND CALCULATIONS
  // ========================================================================

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.club.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableTeams = filteredTeams.filter((t) => !t.isInLeague);
  const teamsInLeague = filteredTeams.filter((t) => t.isInLeague);

  const canAddMoreTeams =
    !league?.configuration?.maxTeams ||
    teamsInLeague.length < league.configuration.maxTeams;

  const registrationOpen = league?.configuration?.registrationOpen ?? true;

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gold-500" />
          <p className="text-charcoal-600 dark:text-charcoal-400">
            Loading teams...
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/10 to-orange-50/10 transition-colors duration-200 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <Link href={`/dashboard/leagues/${leagueId}`}>
            <button className="mb-4 flex items-center gap-2 rounded-lg px-4 py-2 text-charcoal-700 transition-colors hover:bg-neutral-100 hover:text-charcoal-900 dark:text-charcoal-300 dark:hover:bg-charcoal-700 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to League
            </button>
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-orange-400 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-charcoal-900 dark:text-white lg:text-4xl">
                  Team Management
                </h1>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  {league?.name} • {teamsInLeague.length} team
                  {teamsInLeague.length !== 1 ? 's' : ''}
                  {league?.configuration?.maxTeams &&
                    ` / ${league.configuration.maxTeams} max`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {registrationOpen && canAddMoreTeams && (
                <button
                  onClick={() => handleOpenInviteModal()}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Team
                </button>
              )}
              {!registrationOpen && (
                <Badge color="red">Registration Closed</Badge>
              )}
              {!canAddMoreTeams && (
                <Badge color="orange">League Full</Badge>
              )}
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-400 dark:text-charcoal-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams by name, club, or city..."
              className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
            />
          </div>
        </div>

        {/* STATISTICS CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Teams in League"
            value={teamsInLeague.length}
            icon={CheckCircle}
            color="gold"
          />
          <StatCard
            label="Pending Invitations"
            value={invitations.length}
            icon={Clock}
            color="orange"
          />
          <StatCard
            label="Available Teams"
            value={availableTeams.length}
            icon={Users}
            color="blue"
          />
        </div>

        {/* PENDING INVITATIONS */}
        {invitations.length > 0 && (
          <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                <Clock className="h-5 w-5 text-gold-500" />
                Pending Invitations ({invitations.length})
              </h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Teams you've invited that haven't responded yet
              </p>
            </div>
            <div className="space-y-3 p-6">
              {invitations.map((invitation) => (
                <InvitationItem
                  key={invitation.id}
                  invitation={invitation}
                  onCancel={handleCancelInvitation}
                />
              ))}
            </div>
          </div>
        )}

        {/* TEAMS IN LEAGUE */}
        {teamsInLeague.length > 0 && (
          <div className="mb-8 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Teams in League ({teamsInLeague.length})
              </h2>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Teams currently participating in this league
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
              {teamsInLeague.map((team) => (
                <TeamInLeagueCard
                  key={team.id}
                  team={team}
                  onRemove={handleRemoveTeam}
                  isRemoving={removingTeamId === team.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* AVAILABLE TEAMS */}
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-charcoal-700 dark:bg-charcoal-800">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
            <h2 className="flex items-center gap-2 text-xl font-bold text-charcoal-900 dark:text-white">
              <Plus className="h-5 w-5 text-gold-500" />
              Available Teams ({availableTeams.length})
            </h2>
            <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
              Teams that can be invited to join this league
            </p>
          </div>
          <div className="p-6">
            {availableTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto mb-4 h-16 w-16 text-charcoal-300 dark:text-charcoal-600" />
                <h3 className="mb-2 text-xl font-semibold text-charcoal-900 dark:text-white">
                  No available teams
                </h3>
                <p className="text-charcoal-600 dark:text-charcoal-400">
                  All teams have been added or invited to the league
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableTeams.map((team) => (
                  <AvailableTeamCard
                    key={team.id}
                    team={team}
                    onInvite={handleOpenInviteModal}
                    isDisabled={!registrationOpen || !canAddMoreTeams}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVITE TEAM MODAL */}
      {showInviteModal && selectedTeam && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-charcoal-700 dark:bg-charcoal-800">
            <div className="border-b border-neutral-200 px-6 py-4 dark:border-charcoal-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-charcoal-900 dark:text-white">
                  Invite Team
                </h2>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedTeam(null);
                    setInvitationMessage('');
                  }}
                  className="rounded-lg p-1 text-charcoal-600 transition-all hover:bg-neutral-100 dark:text-charcoal-400 dark:hover:bg-charcoal-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-sm text-charcoal-600 dark:text-charcoal-400">
                Send an invitation to {selectedTeam.name}
              </p>
            </div>

            <div className="space-y-4 p-6">
              {/* Team Info */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-charcoal-600 dark:bg-charcoal-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-100 to-orange-100 dark:from-gold-900/30 dark:to-orange-900/30">
                    <Shield className="h-6 w-6 text-gold-600 dark:text-gold-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-white">
                      {selectedTeam.name}
                    </p>
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">
                      {selectedTeam.club.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-semibold text-charcoal-700 dark:text-charcoal-300"
                >
                  Invitation Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-charcoal-900 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-charcoal-600 dark:bg-charcoal-700 dark:text-white dark:focus:border-gold-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedTeam(null);
                    setInvitationMessage('');
                  }}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-semibold text-charcoal-700 transition-all hover:bg-neutral-100 dark:border-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-300 dark:hover:bg-charcoal-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={isSendingInvite}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-orange-500 px-4 py-2 font-semibold text-white transition-all hover:from-gold-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSendingInvite ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
