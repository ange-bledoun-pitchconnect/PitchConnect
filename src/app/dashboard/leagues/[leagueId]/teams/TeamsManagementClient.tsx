// =============================================================================
// 🏆 PITCHCONNECT - TEAMS MANAGEMENT CLIENT COMPONENT
// =============================================================================
// Interactive client component for league team management
// Supports admin invites and team manager join requests
// =============================================================================

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
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
  XCircle,
  HandHelpingIcon,
  Inbox,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

interface TeamInLeague {
  id: string;
  name: string;
  ageGroup: string | null;
  category: string;
  joinedAt: Date;
  club: {
    id: string;
    name: string;
    city: string | null;
    country: string;
  } | null;
}

interface AvailableTeam {
  id: string;
  name: string;
  ageGroup: string | null;
  category: string;
  club: {
    id: string;
    name: string;
    city: string | null;
    country: string;
  } | null;
}

interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  status: string;
  type: 'INVITE' | 'REQUEST';
  createdAt: Date;
  expiresAt: Date | null;
  message: string | null;
  createdBy: {
    firstName: string;
    lastName: string;
  } | null;
}

interface LeagueTeamsData {
  id: string;
  name: string;
  code: string;
  sport: Sport;
  isPublic: boolean;
  configuration: {
    maxTeams: number | null;
    registrationOpen: boolean;
  } | null;
  stats: {
    teamsInLeague: number;
    pendingInvitations: number;
    pendingRequests: number;
    availableTeams: number;
  };
  teamsInLeague: TeamInLeague[];
  availableTeams: AvailableTeam[];
  pendingInvitations: Invitation[];
  pendingRequests: Invitation[];
}

interface SportConfig {
  label: string;
  icon: string;
  color: string;
}

interface TeamsManagementClientProps {
  leagueId: string;
  league: LeagueTeamsData;
  sportConfig: SportConfig;
  isAdmin: boolean;
  isTeamManager: boolean;
  userTeamIds: string[];
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export default function TeamsManagementClient({
  leagueId,
  league,
  sportConfig,
  isAdmin,
  isTeamManager,
  userTeamIds,
}: TeamsManagementClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<AvailableTeam | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);
  const [processingInvitationId, setProcessingInvitationId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Local state for optimistic updates
  const [teamsInLeague, setTeamsInLeague] = useState(league.teamsInLeague);
  const [availableTeams, setAvailableTeams] = useState(league.availableTeams);
  const [pendingInvitations, setPendingInvitations] = useState(league.pendingInvitations);
  const [pendingRequests, setPendingRequests] = useState(league.pendingRequests);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Filter teams by search
  const filteredTeamsInLeague = useMemo(() => {
    return teamsInLeague.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.club?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.club?.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamsInLeague, searchQuery]);

  const filteredAvailableTeams = useMemo(() => {
    return availableTeams.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.club?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.club?.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTeams, searchQuery]);

  // Check limits
  const canAddMoreTeams = !league.configuration?.maxTeams || teamsInLeague.length < league.configuration.maxTeams;
  const registrationOpen = league.configuration?.registrationOpen ?? true;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleOpenInviteModal = (team: AvailableTeam) => {
    setSelectedTeam(team);
    setShowInviteModal(true);
  };

  const handleSendInvitation = async () => {
    if (!selectedTeam) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          type: 'INVITE',
          message: inviteMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      // Optimistic update
      setAvailableTeams(prev => prev.filter(t => t.id !== selectedTeam.id));
      setPendingInvitations(prev => [...prev, {
        id: Date.now().toString(),
        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        status: 'PENDING',
        type: 'INVITE',
        createdAt: new Date(),
        expiresAt: null,
        message: inviteMessage,
        createdBy: null,
      }]);

      showToast(`Invitation sent to ${selectedTeam.name}`, 'success');
      setShowInviteModal(false);
      setSelectedTeam(null);
      setInviteMessage('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to send invitation', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestToJoin = async (team: AvailableTeam) => {
    if (!confirm(`Request to join ${league.name} with ${team.name}?`)) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: team.id,
          type: 'REQUEST',
          message: '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send request');
      }

      showToast(`Join request sent for ${team.name}`, 'success');
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to send request', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Cancel this invitation?')) return;

    setProcessingInvitationId(invitationId);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cancel invitation');

      setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
      showToast('Invitation cancelled', 'success');
    } catch (error) {
      showToast('Failed to cancel invitation', 'error');
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleAcceptRequest = async (invitation: Invitation) => {
    setProcessingInvitationId(invitation.id);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invitations/${invitation.id}/accept`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to accept request');

      // Optimistic update
      setPendingRequests(prev => prev.filter(i => i.id !== invitation.id));
      showToast(`${invitation.teamName} added to league`, 'success');
      router.refresh();
    } catch (error) {
      showToast('Failed to accept request', 'error');
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleRejectRequest = async (invitation: Invitation) => {
    if (!confirm(`Reject join request from ${invitation.teamName}?`)) return;

    setProcessingInvitationId(invitation.id);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invitations/${invitation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to reject request');

      setPendingRequests(prev => prev.filter(i => i.id !== invitation.id));
      showToast('Request rejected', 'success');
    } catch (error) {
      showToast('Failed to reject request', 'error');
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleRemoveTeam = async (team: TeamInLeague) => {
    if (!confirm(`Remove ${team.name} from the league?`)) return;

    setRemovingTeamId(team.id);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/teams/${team.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove team');

      setTeamsInLeague(prev => prev.filter(t => t.id !== team.id));
      showToast(`${team.name} removed from league`, 'success');
    } catch (error) {
      showToast('Failed to remove team', 'error');
    } finally {
      setRemovingTeamId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Teams in League"
          value={teamsInLeague.length}
          subtext={league.configuration?.maxTeams ? `Max: ${league.configuration.maxTeams}` : undefined}
          icon={<CheckCircle className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          label="Pending Invitations"
          value={pendingInvitations.length}
          icon={<Clock className="w-6 h-6 text-amber-500" />}
        />
        <StatCard
          label="Join Requests"
          value={pendingRequests.length}
          icon={<Inbox className="w-6 h-6 text-purple-500" />}
        />
        <StatCard
          label="Available Teams"
          value={availableTeams.length}
          icon={<Users className="w-6 h-6 text-blue-500" />}
        />
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by name, club, or city..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Join Requests (Admin Only) */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-purple-50 dark:bg-purple-900/20">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-purple-500" />
              Join Requests ({pendingRequests.length})
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Teams requesting to join this league
            </p>
          </div>
          <div className="p-5 space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <HandHelpingIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{req.teamName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Requested {new Date(req.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    disabled={processingInvitationId === req.id || !canAddMoreTeams}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingInvitationId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req)}
                    disabled={processingInvitationId === req.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {isAdmin && pendingInvitations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Invitations ({pendingInvitations.length})
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Teams you've invited that haven't responded yet
            </p>
          </div>
          <div className="p-5 space-y-3">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Send className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{inv.teamName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Invited {new Date(inv.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvitation(inv.id)}
                  disabled={processingInvitationId === inv.id}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50"
                >
                  {processingInvitationId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams in League */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Teams in League ({filteredTeamsInLeague.length})
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Teams currently participating in this league
          </p>
        </div>
        <div className="p-5">
          {filteredTeamsInLeague.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
              title="No teams in league"
              description={isAdmin ? "Invite teams to get started" : "No teams have joined yet"}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeamsInLeague.map((team) => (
                <TeamInLeagueCard
                  key={team.id}
                  team={team}
                  sportIcon={sportConfig.icon}
                  isAdmin={isAdmin}
                  isRemoving={removingTeamId === team.id}
                  onRemove={() => handleRemoveTeam(team)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Teams */}
      {(isAdmin || isTeamManager) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Available Teams ({filteredAvailableTeams.length})
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {isAdmin ? "Teams that can be invited to join" : "Your teams that can request to join"}
            </p>
          </div>
          <div className="p-5">
            {!registrationOpen ? (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 text-red-300 dark:text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Registration Closed</h3>
                <p className="text-slate-600 dark:text-slate-400">This league is not accepting new teams</p>
              </div>
            ) : !canAddMoreTeams ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-amber-300 dark:text-amber-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">League Full</h3>
                <p className="text-slate-600 dark:text-slate-400">Maximum team limit reached</p>
              </div>
            ) : filteredAvailableTeams.length === 0 ? (
              <EmptyState
                icon={<Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />}
                title="No available teams"
                description="All teams have been added or invited"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailableTeams
                  .filter(t => isAdmin || userTeamIds.includes(t.id))
                  .map((team) => (
                    <AvailableTeamCard
                      key={team.id}
                      team={team}
                      sportIcon={sportConfig.icon}
                      isAdmin={isAdmin}
                      onInvite={() => handleOpenInviteModal(team)}
                      onRequest={() => handleRequestToJoin(team)}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invite Team</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Send an invitation to {selectedTeam.name}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                    <span className="text-xl">{sportConfig.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedTeam.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedTeam.club?.name}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendInvitation}
                  disabled={isSending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Invitation
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedTeam(null);
                    setInviteMessage('');
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({ label, value, subtext, icon }: { label: string; value: number; subtext?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
        </div>
        {icon}
      </div>
    </div>
  );
}

function TeamInLeagueCard({ team, sportIcon, isAdmin, isRemoving, onRemove }: {
  team: TeamInLeague;
  sportIcon: string;
  isAdmin: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-lg">{sportIcon}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{team.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{team.club?.name || 'Independent'}</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
          >
            {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>
      {team.club?.city && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <MapPin className="w-3 h-3" />
          {team.club.city}, {team.club.country}
        </div>
      )}
      <div className="flex items-center gap-2">
        {team.ageGroup && (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold">
            {team.ageGroup}
          </span>
        )}
        <span className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400 rounded text-xs font-semibold">
          {team.category.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}

function AvailableTeamCard({ team, sportIcon, isAdmin, onInvite, onRequest }: {
  team: AvailableTeam;
  sportIcon: string;
  isAdmin: boolean;
  onInvite: () => void;
  onRequest: () => void;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
          <span className="text-lg">{sportIcon}</span>
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{team.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{team.club?.name || 'Independent'}</p>
        </div>
      </div>
      {team.club?.city && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <MapPin className="w-3 h-3" />
          {team.club.city}, {team.club.country}
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        {team.ageGroup && (
          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-semibold">
            {team.ageGroup}
          </span>
        )}
        <span className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400 rounded text-xs font-semibold">
          {team.category.replace(/_/g, ' ')}
        </span>
      </div>
      <button
        onClick={isAdmin ? onInvite : onRequest}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl"
      >
        <UserPlus className="w-4 h-4" />
        {isAdmin ? 'Invite to League' : 'Request to Join'}
      </button>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}