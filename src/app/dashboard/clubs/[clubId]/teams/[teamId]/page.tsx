// =============================================================================
// 🏆 PITCHCONNECT - TEAM DETAILS PAGE v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/clubs/[clubId]/teams/[teamId]
// Access: CLUB_OWNER, MANAGER, HEAD_COACH, ASSISTANT_COACH, team members
// 
// FEATURES:
// ✅ Multi-sport position support
// ✅ TeamPlayer roster (from schema)
// ✅ Coach assignments display
// ✅ Join requests management link
// ✅ Jersey number management
// ✅ Captain/Vice-captain badges
// ✅ Add/remove players
// ✅ Role-based permissions
// ✅ Schema-aligned with Team, TeamPlayer, ClubMember models
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Users,
  Plus,
  Settings,
  Loader2,
  Mail,
  Shield,
  UserMinus,
  Trophy,
  Edit,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  X,
  Star,
  Bell,
  Calendar,
  Hash,
  UserPlus,
  Eye,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type Position = string; // Using string for flexibility across sports

interface TeamPlayer {
  id: string;
  playerId: string;
  position: Position | null;
  jerseyNumber: number | null;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  joinedAt: string;
  joinedVia: string | null;
  player: {
    id: string;
    userId: string;
    primaryPosition: Position | null;
    overallRating: number | null;
    formRating: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
    };
  };
}

interface Coach {
  id: string;
  role: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  ageGroup: string | null;
  gender: string | null;
  status: string;
  description: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  acceptingJoinRequests: boolean;
  requiresApproval: boolean;
  club: {
    id: string;
    name: string;
    sport: Sport;
    primaryColor: string | null;
    secondaryColor: string | null;
    managerId: string;
    ownerId: string | null;
  };
  players: TeamPlayer[];
  _count: {
    players: number;
    joinRequests: number;
  };
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, { label: string; icon: string; color: string }> = {
  FOOTBALL: { label: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
  NETBALL: { label: 'Netball', icon: '🏐', color: 'from-pink-500 to-rose-600' },
  RUGBY: { label: 'Rugby', icon: '🏉', color: 'from-red-500 to-orange-600' },
  BASKETBALL: { label: 'Basketball', icon: '🏀', color: 'from-orange-500 to-amber-600' },
  CRICKET: { label: 'Cricket', icon: '🏏', color: 'from-yellow-500 to-lime-600' },
  HOCKEY: { label: 'Hockey', icon: '🏒', color: 'from-blue-500 to-cyan-600' },
  AMERICAN_FOOTBALL: { label: 'American Football', icon: '🏈', color: 'from-indigo-500 to-purple-600' },
  LACROSSE: { label: 'Lacrosse', icon: '🥍', color: 'from-violet-500 to-purple-600' },
  AUSTRALIAN_RULES: { label: 'Australian Rules', icon: '🦘', color: 'from-yellow-500 to-red-600' },
  GAELIC_FOOTBALL: { label: 'Gaelic Football', icon: '☘️', color: 'from-green-500 to-yellow-600' },
  FUTSAL: { label: 'Futsal', icon: '⚽', color: 'from-teal-500 to-green-600' },
  BEACH_FOOTBALL: { label: 'Beach Football', icon: '🏖️', color: 'from-amber-400 to-orange-500' },
};

// Sport-specific positions
const POSITION_LABELS: Record<string, string> = {
  // Football
  GOALKEEPER: 'GK', CENTER_BACK: 'CB', LEFT_BACK: 'LB', RIGHT_BACK: 'RB',
  DEFENSIVE_MIDFIELDER: 'CDM', CENTRAL_MIDFIELDER: 'CM', ATTACKING_MIDFIELDER: 'CAM',
  LEFT_WINGER: 'LW', RIGHT_WINGER: 'RW', STRIKER: 'ST', CENTER_FORWARD: 'CF',
  // Basketball
  POINT_GUARD: 'PG', SHOOTING_GUARD: 'SG', SMALL_FORWARD: 'SF', POWER_FORWARD: 'PF', CENTER_BASKETBALL: 'C',
  // Netball
  GOAL_SHOOTER: 'GS', GOAL_ATTACK: 'GA', WING_ATTACK: 'WA', CENTER: 'C',
  WING_DEFENSE: 'WD', GOAL_DEFENSE: 'GD', GOALKEEPER_NETBALL: 'GK',
  // Rugby
  PROP: 'Prop', HOOKER: 'Hooker', LOCK: 'Lock', FLANKER: 'Flanker',
  NUMBER_8: 'No.8', SCRUM_HALF: 'SH', FLY_HALF: 'FH', FULLBACK: 'FB',
  // Generic
  UTILITY: 'UTL', SUBSTITUTE: 'SUB',
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HEAD_COACH: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  ASSISTANT_COACH: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  GOALKEEPING_COACH: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
  PERFORMANCE_COACH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
};

// =============================================================================
// TOAST COMPONENT
// =============================================================================

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClasses = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 ${typeClasses[type]}`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const StatCard = ({ label, value, color = 'text-white' }: { label: string; value: number | string; color?: string }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
    <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const MemberAvatar = ({ avatar, firstName, lastName, size = 'md' }: { avatar?: string | null; firstName: string; lastName: string; size?: 'sm' | 'md' | 'lg' }) => {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-16 w-16 text-lg' };

  if (avatar) {
    return <Image src={avatar} alt={`${firstName} ${lastName}`} width={48} height={48} className={`${sizes[size]} rounded-full object-cover`} />;
  }

  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-orange-500 font-bold text-white`}>
      {initials}
    </div>
  );
};

const PlayerRow = ({
  teamPlayer,
  canManage,
  onRemove,
  onToggleCaptain,
}: {
  teamPlayer: TeamPlayer;
  canManage: boolean;
  onRemove: (id: string, name: string) => void;
  onToggleCaptain: (id: string, type: 'captain' | 'viceCaptain') => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { player } = teamPlayer;
  const positionLabel = teamPlayer.position ? (POSITION_LABELS[teamPlayer.position] || teamPlayer.position.replace(/_/g, ' ')) : '-';

  return (
    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all">
      <div className="flex items-center gap-4">
        {/* Jersey Number */}
        <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center font-bold text-white">
          {teamPlayer.jerseyNumber ?? '-'}
        </div>

        {/* Avatar */}
        <MemberAvatar avatar={player.user.avatar} firstName={player.user.firstName} lastName={player.user.lastName} />

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">
              {player.user.firstName} {player.user.lastName}
            </p>
            {teamPlayer.isCaptain && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-gold-500/20 text-gold-400 border border-gold-500/30">C</span>
            )}
            {teamPlayer.isViceCaptain && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">VC</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>{positionLabel}</span>
            {player.overallRating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-gold-400" />
                {player.overallRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          teamPlayer.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
        }`}>
          {teamPlayer.isActive ? 'Active' : 'Inactive'}
        </span>

        {canManage && (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-slate-600 transition-colors">
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-600 bg-slate-800 shadow-lg z-50">
                <button onClick={() => { onToggleCaptain(teamPlayer.id, 'captain'); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700">
                  <Star className="h-4 w-4" />
                  {teamPlayer.isCaptain ? 'Remove Captain' : 'Make Captain'}
                </button>
                <button onClick={() => { onToggleCaptain(teamPlayer.id, 'viceCaptain'); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700">
                  <Shield className="h-4 w-4" />
                  {teamPlayer.isViceCaptain ? 'Remove Vice Captain' : 'Make Vice Captain'}
                </button>
                <div className="border-t border-slate-700" />
                <button onClick={() => { onRemove(teamPlayer.id, `${player.user.firstName} ${player.user.lastName}`); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                  <UserMinus className="h-4 w-4" />
                  Remove from Team
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TeamDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const clubId = params.clubId as string;
  const teamId = params.teamId as string;

  // State
  const [team, setTeam] = useState<Team | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch data
  const fetchTeamData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [teamRes, coachesRes] = await Promise.all([
        fetch(`/api/clubs/${clubId}/teams/${teamId}`),
        fetch(`/api/clubs/${clubId}/teams/${teamId}/coaches`).catch(() => ({ ok: false })),
      ]);

      if (!teamRes.ok) throw new Error('Failed to fetch team');

      const teamData = await teamRes.json();
      setTeam(teamData.team || teamData);

      if (coachesRes.ok) {
        const coachesData = await (coachesRes as Response).json();
        setCoaches(Array.isArray(coachesData.coaches) ? coachesData.coaches : []);
      }
    } catch (error) {
      showToast('Failed to load team data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [clubId, teamId, showToast]);

  useEffect(() => {
    if (clubId && teamId) fetchTeamData();
  }, [clubId, teamId, fetchTeamData]);

  // Permissions
  const canManage = useMemo(() => {
    if (!session?.user?.id || !team) return false;
    if (session.user.isSuperAdmin) return true;
    return session.user.id === team.club.managerId || session.user.id === team.club.ownerId;
  }, [session, team]);

  // Handlers
  const handleRemovePlayer = async (teamPlayerId: string, playerName: string) => {
    if (!confirm(`Remove ${playerName} from this team?`)) return;

    try {
      setProcessingId(teamPlayerId);
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/players/${teamPlayerId}`, { method: 'DELETE' });

      if (!response.ok) throw new Error('Failed to remove player');

      setTeam(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== teamPlayerId) } : null);
      showToast(`${playerName} removed from team`, 'success');
    } catch (error) {
      showToast('Failed to remove player', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleCaptain = async (teamPlayerId: string, type: 'captain' | 'viceCaptain') => {
    try {
      setProcessingId(teamPlayerId);
      const player = team?.players.find(p => p.id === teamPlayerId);
      if (!player) return;

      const newValue = type === 'captain' ? !player.isCaptain : !player.isViceCaptain;
      
      const response = await fetch(`/api/clubs/${clubId}/teams/${teamId}/players/${teamPlayerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type === 'captain' ? 'isCaptain' : 'isViceCaptain']: newValue }),
      });

      if (!response.ok) throw new Error('Failed to update player');

      setTeam(prev => prev ? {
        ...prev,
        players: prev.players.map(p => 
          p.id === teamPlayerId 
            ? { ...p, [type === 'captain' ? 'isCaptain' : 'isViceCaptain']: newValue }
            : p
        ),
      } : null);

      showToast(`Player ${newValue ? 'assigned as' : 'removed from'} ${type === 'captain' ? 'captain' : 'vice captain'}`, 'success');
    } catch (error) {
      showToast('Failed to update player', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Derived data
  const sportConfig = team ? SPORT_CONFIG[team.club.sport] : null;
  const activePlayers = team?.players.filter(p => p.isActive) || [];
  const pendingRequests = team?._count.joinRequests || 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Team Not Found</h1>
          <Link href={`/dashboard/clubs/${clubId}`} className="text-gold-400 hover:text-gold-300 flex items-center gap-2 justify-center">
            <ArrowLeft className="h-4 w-4" />
            Back to Club
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/clubs/${clubId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to {team.club.name}
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Team Info */}
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${sportConfig?.color || 'from-gold-500 to-orange-500'} flex items-center justify-center shadow-lg`}>
                <span className="text-4xl">{sportConfig?.icon || '🏆'}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-3xl font-bold text-white">{team.name}</h1>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    team.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {team.status}
                  </span>
                </div>
                <p className="text-slate-400 flex items-center gap-2 flex-wrap">
                  <span>{team.ageGroup || 'Open'}</span>
                  <span>•</span>
                  <span>{team.gender || 'Mixed'}</span>
                  <span>•</span>
                  <Users className="h-4 w-4" />
                  <span>{activePlayers.length} players</span>
                </p>
                {team.description && (
                  <p className="text-sm text-slate-300 mt-2 max-w-xl">{team.description}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              {team.acceptingJoinRequests && pendingRequests > 0 && (
                <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/join-requests`} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg transition-colors">
                  <Bell className="h-4 w-4" />
                  {pendingRequests} Join Requests
                </Link>
              )}
              {canManage && (
                <>
                  <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/add-player`} className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors">
                    <UserPlus className="h-4 w-4" />
                    Add Player
                  </Link>
                  <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/settings`} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                    <Settings className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Players" value={team._count.players} color="text-blue-400" />
          <StatCard label="Active" value={activePlayers.length} color="text-emerald-400" />
          <StatCard label="Squad Max" value={team.maxPlayers || '-'} color="text-slate-300" />
          <StatCard label="Pending Requests" value={pendingRequests} color={pendingRequests > 0 ? 'text-amber-400' : 'text-slate-400'} />
        </div>

        {/* Coaches Section */}
        {coaches.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Coaching Staff
            </h2>
            <div className="flex flex-wrap gap-4">
              {coaches.map(coach => {
                const roleColor = ROLE_COLORS[coach.role] || ROLE_COLORS.ASSISTANT_COACH;
                return (
                  <div key={coach.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <MemberAvatar avatar={coach.user.avatar} firstName={coach.user.firstName} lastName={coach.user.lastName} size="sm" />
                    <div>
                      <p className="font-medium text-white">{coach.user.firstName} {coach.user.lastName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${roleColor.bg} ${roleColor.text} border ${roleColor.border}`}>
                        {coach.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Players Roster */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-gold-400" />
                Squad Roster
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {activePlayers.length} / {team.maxPlayers || '∞'} players
              </p>
            </div>
            {team.acceptingJoinRequests && (
              <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/join-requests`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                <Eye className="h-4 w-4" />
                View Join Requests
              </Link>
            )}
          </div>

          <div className="p-6">
            {team.players.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Players Yet</h3>
                <p className="text-slate-400 mb-6">Add players to build your squad</p>
                {canManage && (
                  <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/add-player`} className="inline-flex items-center gap-2 px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-xl transition-colors">
                    <UserPlus className="h-5 w-5" />
                    Add First Player
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Headers */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Player</div>
                  <div className="col-span-2">Position</div>
                  <div className="col-span-2">Rating</div>
                  <div className="col-span-2">Status</div>
                </div>

                {/* Players */}
                {team.players.map(teamPlayer => (
                  <PlayerRow
                    key={teamPlayer.id}
                    teamPlayer={teamPlayer}
                    canManage={canManage}
                    onRemove={handleRemovePlayer}
                    onToggleCaptain={handleToggleCaptain}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions for Managers */}
        {canManage && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/formations`} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
              <Trophy className="h-6 w-6 text-gold-400" />
              <span className="text-white font-medium">Formations</span>
            </Link>
            <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/matches`} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
              <Calendar className="h-6 w-6 text-blue-400" />
              <span className="text-white font-medium">Matches</span>
            </Link>
            <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/training`} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
              <Shield className="h-6 w-6 text-emerald-400" />
              <span className="text-white font-medium">Training</span>
            </Link>
            <Link href={`/dashboard/clubs/${clubId}/teams/${teamId}/analytics`} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
              <Hash className="h-6 w-6 text-purple-400" />
              <span className="text-white font-medium">Analytics</span>
            </Link>
          </div>
        )}
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}