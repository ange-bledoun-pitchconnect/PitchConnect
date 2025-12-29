// =============================================================================
// 🏆 PITCHCONNECT - COACH SQUAD MANAGEMENT v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/coach/team
// Access: HEAD_COACH, ASSISTANT_COACH, PERFORMANCE_COACH, MANAGER
// 
// FEATURES:
// ✅ Combined ClubMember + TeamPlayer view
// ✅ Team filtering (for calling up youngsters from other teams)
// ✅ Player availability status (Available, Injured, Suspended)
// ✅ Sport-specific position labels
// ✅ Player statistics and ratings
// ✅ Injury tracking
// ✅ Multi-sport support for all 12 sports
// ✅ Schema-aligned with TeamPlayer, Player, ClubMember, Injury
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Plus,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  Heart,
  Shield,
  TrendingUp,
  Activity,
  Award,
  Edit3,
  Eye,
  UserPlus,
  Loader2,
  ChevronDown,
  Star,
  Target,
  X,
  AlertCircle,
  Calendar,
  Clock,
  Zap,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type PlayerAvailability = 'AVAILABLE' | 'INJURED' | 'SUSPENDED' | 'UNAVAILABLE' | 'ON_LOAN';

type ClubMemberRole =
  | 'OWNER' | 'MANAGER' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'PLAYER'
  | 'STAFF' | 'TREASURER' | 'SCOUT' | 'ANALYST' | 'MEDICAL_STAFF'
  | 'PHYSIOTHERAPIST' | 'NUTRITIONIST' | 'PSYCHOLOGIST' | 'PERFORMANCE_COACH'
  | 'GOALKEEPING_COACH' | 'KIT_MANAGER' | 'MEDIA_OFFICER';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  dateOfBirth?: string | null;
}

interface Player {
  id: string;
  userId: string;
  primaryPosition?: string | null;
  secondaryPosition?: string | null;
  preferredFoot?: string | null;
  height?: number | null;
  weight?: number | null;
  overallRating?: number | null;
  formRating?: number | null;
  potentialRating?: number | null;
  injuryStatus?: string | null;
  user: User;
}

interface TeamPlayer {
  id: string;
  playerId: string;
  teamId: string;
  position?: string | null;
  jerseyNumber?: number | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isActive: boolean;
  joinedAt: string;
  player: Player;
}

interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  role: ClubMemberRole;
  isActive: boolean;
  user: User;
}

interface Team {
  id: string;
  name: string;
  ageGroup?: string | null;
  gender?: string | null;
  clubId: string;
  club: {
    id: string;
    name: string;
    sport: Sport;
  };
}

interface Injury {
  id: string;
  playerId: string;
  type: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'SEVERE';
  startDate: string;
  expectedReturnDate?: string | null;
  status: 'ACTIVE' | 'RECOVERING' | 'RECOVERED';
}

interface SquadStats {
  totalPlayers: number;
  available: number;
  injured: number;
  suspended: number;
  averageRating: number;
  averageAge: number;
  totalGoals: number;
  totalAssists: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// =============================================================================
// SPORT CONFIGURATION
// =============================================================================

const SPORT_CONFIG: Record<Sport, {
  label: string;
  icon: string;
  color: string;
  positions: string[];
}> = {
  FOOTBALL: {
    label: 'Football',
    icon: '⚽',
    color: 'from-green-500 to-emerald-600',
    positions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'],
  },
  BASKETBALL: {
    label: 'Basketball',
    icon: '🏀',
    color: 'from-orange-500 to-amber-600',
    positions: ['PG', 'SG', 'SF', 'PF', 'C'],
  },
  RUGBY: {
    label: 'Rugby',
    icon: '🏉',
    color: 'from-red-500 to-orange-600',
    positions: ['LP', 'HK', 'TP', 'LR', 'LL', 'BF', 'OF', 'LF', 'SH', 'FH', 'IC', 'OC', 'LW', 'RW', 'FB'],
  },
  NETBALL: {
    label: 'Netball',
    icon: '🏐',
    color: 'from-pink-500 to-rose-600',
    positions: ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'],
  },
  CRICKET: {
    label: 'Cricket',
    icon: '🏏',
    color: 'from-yellow-500 to-lime-600',
    positions: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
  },
  HOCKEY: {
    label: 'Hockey',
    icon: '🏒',
    color: 'from-blue-500 to-cyan-600',
    positions: ['GK', 'LB', 'CB', 'RB', 'LM', 'CM', 'RM', 'LF', 'CF', 'RF'],
  },
  AMERICAN_FOOTBALL: {
    label: 'American Football',
    icon: '🏈',
    color: 'from-indigo-500 to-purple-600',
    positions: ['QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'],
  },
  LACROSSE: {
    label: 'Lacrosse',
    icon: '🥍',
    color: 'from-violet-500 to-purple-600',
    positions: ['G', 'D', 'M', 'A'],
  },
  AUSTRALIAN_RULES: {
    label: 'Australian Rules',
    icon: '🦘',
    color: 'from-yellow-500 to-red-600',
    positions: ['FB', 'BP', 'CHB', 'HBF', 'W', 'C', 'R', 'RR', 'HFF', 'CHF', 'FP', 'FF'],
  },
  GAELIC_FOOTBALL: {
    label: 'Gaelic Football',
    icon: '☘️',
    color: 'from-green-500 to-yellow-600',
    positions: ['GK', 'CB', 'FB', 'HB', 'CHB', 'MF', 'HF', 'CHF', 'CF', 'FF'],
  },
  FUTSAL: {
    label: 'Futsal',
    icon: '⚽',
    color: 'from-teal-500 to-green-600',
    positions: ['GK', 'FIX', 'ALA', 'PIV'],
  },
  BEACH_FOOTBALL: {
    label: 'Beach Football',
    icon: '🏖️',
    color: 'from-amber-400 to-orange-500',
    positions: ['GK', 'DEF', 'MID', 'FWD'],
  },
};

const AVAILABILITY_CONFIG: Record<PlayerAvailability, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  AVAILABLE: { label: 'Available', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
  INJURED: { label: 'Injured', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: Heart },
  SUSPENDED: { label: 'Suspended', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: Shield },
  UNAVAILABLE: { label: 'Unavailable', color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-900/30', icon: AlertTriangle },
  ON_LOAN: { label: 'On Loan', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: UserPlus },
};

const INJURY_SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  MINOR: { label: 'Minor', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  MODERATE: { label: 'Moderate', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  MAJOR: { label: 'Major', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  SEVERE: { label: 'Severe', color: 'text-red-800 bg-red-200 dark:bg-red-900/50' },
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
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-50 ${typeClasses[type]}`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="h-4 w-4" /></button>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const StatCard = ({ label, value, subtext, icon: Icon, color }: { label: string; value: string | number; subtext?: string; icon: React.ElementType; color: string }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-all group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        {subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const PlayerRow = ({
  player,
  teamPlayer,
  sport,
  injury,
  onView,
  onEdit,
  onCallUp,
  isFromOtherTeam = false,
}: {
  player: Player;
  teamPlayer?: TeamPlayer | null;
  sport: Sport;
  injury?: Injury | null;
  onView: () => void;
  onEdit: () => void;
  onCallUp?: () => void;
  isFromOtherTeam?: boolean;
}) => {
  const availability: PlayerAvailability = injury?.status === 'ACTIVE' 
    ? 'INJURED' 
    : player.injuryStatus === 'SUSPENDED'
    ? 'SUSPENDED'
    : 'AVAILABLE';
  
  const availabilityConfig = AVAILABILITY_CONFIG[availability];
  const AvailabilityIcon = availabilityConfig.icon;

  const age = player.user.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <tr className={`hover:bg-gold-50 dark:hover:bg-slate-700/50 transition-colors ${isFromOtherTeam ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
      {/* Jersey Number */}
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-500 to-orange-500 flex items-center justify-center font-bold text-white">
          {teamPlayer?.jerseyNumber || '-'}
        </div>
      </td>

      {/* Player Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
            {player.user.avatar ? (
              <Image src={player.user.avatar} alt="" width={40} height={40} className="object-cover" />
            ) : (
              <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                {player.user.firstName[0]}{player.user.lastName[0]}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              {player.user.firstName} {player.user.lastName}
              {teamPlayer?.isCaptain && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-gold-500/20 text-gold-600 dark:text-gold-400">C</span>
              )}
              {teamPlayer?.isViceCaptain && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-slate-500/20 text-slate-600 dark:text-slate-400">VC</span>
              )}
              {isFromOtherTeam && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400">Other Team</span>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {age ? `${age} years` : ''} {player.preferredFoot ? `• ${player.preferredFoot}` : ''}
            </p>
          </div>
        </div>
      </td>

      {/* Position */}
      <td className="px-4 py-3">
        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
          {teamPlayer?.position || player.primaryPosition || 'N/A'}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${availabilityConfig.bgColor} ${availabilityConfig.color}`}>
          <AvailabilityIcon className="w-3 h-3" />
          {availabilityConfig.label}
        </span>
        {injury && injury.status === 'ACTIVE' && (
          <p className="text-xs text-red-500 mt-1">
            {injury.type} - Return: {injury.expectedReturnDate 
              ? new Date(injury.expectedReturnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : 'TBD'
            }
          </p>
        )}
      </td>

      {/* Rating */}
      <td className="px-4 py-3 text-center">
        {player.overallRating ? (
          <div className="flex items-center justify-center gap-1">
            <Star className="w-4 h-4 text-gold-500" />
            <span className="font-bold text-gold-600 dark:text-gold-400">{player.overallRating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>

      {/* Form */}
      <td className="px-4 py-3 text-center">
        {player.formRating ? (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
            player.formRating >= 7 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
            player.formRating >= 5 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
            'bg-red-100 dark:bg-red-900/30 text-red-600'
          }`}>
            <Zap className="w-3 h-3" />
            <span className="text-sm font-semibold">{player.formRating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {isFromOtherTeam && onCallUp && (
            <button
              onClick={onCallUp}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="Call up to team"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onView}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="View player"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-gold-100 dark:bg-gold-900/30 text-gold-600 hover:bg-gold-200 dark:hover:bg-gold-900/50 transition-colors"
            title="Edit player"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CoachSquadManagementPage() {
  const router = useRouter();

  // State
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [otherTeamPlayers, setOtherTeamPlayers] = useState<TeamPlayer[]>([]);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [stats, setStats] = useState<SquadStats | null>(null);
  const [currentSport, setCurrentSport] = useState<Sport>('FOOTBALL');

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlayerAvailability>('ALL');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [showOtherTeams, setShowOtherTeams] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/coach/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data.teams || []);
          if (data.teams?.[0]) {
            setSelectedTeam(data.teams[0]);
            setCurrentSport(data.teams[0].club.sport || 'FOOTBALL');
          }
        }
      } catch (error) {
        showToast('Failed to load teams', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [showToast]);

  // Fetch squad when team changes
  useEffect(() => {
    if (!selectedTeam) return;

    const fetchSquadData = async () => {
      try {
        const [playersRes, injuriesRes, statsRes, otherRes] = await Promise.all([
          fetch(`/api/teams/${selectedTeam.id}/players`),
          fetch(`/api/teams/${selectedTeam.id}/injuries?status=ACTIVE`),
          fetch(`/api/teams/${selectedTeam.id}/stats`),
          showOtherTeams ? fetch(`/api/clubs/${selectedTeam.clubId}/players?excludeTeam=${selectedTeam.id}`) : Promise.resolve(null),
        ]);

        if (playersRes.ok) {
          const data = await playersRes.json();
          setTeamPlayers(data.players || []);
        }

        if (injuriesRes.ok) {
          const data = await injuriesRes.json();
          setInjuries(data.injuries || []);
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats || null);
        }

        if (otherRes && otherRes.ok) {
          const data = await otherRes.json();
          setOtherTeamPlayers(data.players || []);
        }

        setCurrentSport(selectedTeam.club.sport || 'FOOTBALL');
      } catch (error) {
        console.error('Failed to fetch squad data:', error);
      }
    };

    fetchSquadData();
  }, [selectedTeam, showOtherTeams]);

  // Get injury for player
  const getPlayerInjury = useCallback((playerId: string) => {
    return injuries.find(i => i.playerId === playerId && i.status === 'ACTIVE');
  }, [injuries]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    let players = [...teamPlayers];

    // Add other team players if enabled
    if (showOtherTeams) {
      players = [...players, ...otherTeamPlayers];
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      players = players.filter(tp => 
        tp.player.user.firstName.toLowerCase().includes(query) ||
        tp.player.user.lastName.toLowerCase().includes(query) ||
        tp.position?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      players = players.filter(tp => {
        const injury = getPlayerInjury(tp.playerId);
        const availability: PlayerAvailability = injury?.status === 'ACTIVE' 
          ? 'INJURED' 
          : tp.player.injuryStatus === 'SUSPENDED'
          ? 'SUSPENDED'
          : 'AVAILABLE';
        return availability === statusFilter;
      });
    }

    // Position filter
    if (positionFilter !== 'ALL') {
      players = players.filter(tp => 
        (tp.position || tp.player.primaryPosition) === positionFilter
      );
    }

    return players;
  }, [teamPlayers, otherTeamPlayers, showOtherTeams, searchQuery, statusFilter, positionFilter, getPlayerInjury]);

  // Stats calculations
  const squadStats = useMemo(() => {
    const total = teamPlayers.length;
    const available = teamPlayers.filter(tp => !getPlayerInjury(tp.playerId)).length;
    const injured = teamPlayers.filter(tp => getPlayerInjury(tp.playerId)).length;
    const suspended = teamPlayers.filter(tp => tp.player.injuryStatus === 'SUSPENDED').length;
    const avgRating = teamPlayers.length > 0
      ? teamPlayers.reduce((sum, tp) => sum + (tp.player.overallRating || 0), 0) / teamPlayers.length
      : 0;

    return { total, available, injured, suspended, avgRating };
  }, [teamPlayers, getPlayerInjury]);

  // Sport config
  const sportConfig = SPORT_CONFIG[currentSport];

  // Call up player
  const handleCallUp = async (player: TeamPlayer) => {
    if (!selectedTeam) return;

    try {
      const res = await fetch(`/api/teams/${selectedTeam.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.playerId }),
      });

      if (!res.ok) throw new Error('Failed to call up player');

      showToast(`${player.player.user.firstName} called up to ${selectedTeam.name}!`, 'success');
      
      // Refresh squad
      const refreshRes = await fetch(`/api/teams/${selectedTeam.id}/players`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setTeamPlayers(data.players || []);
      }
    } catch (error) {
      showToast('Failed to call up player', 'error');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-purple-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading squad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/10 to-purple-50/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sportConfig.color} flex items-center justify-center shadow-lg`}>
              <span className="text-3xl">{sportConfig.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Squad Management</h1>
              <p className="text-slate-600 dark:text-slate-400">
                {selectedTeam?.name || 'Select a team'} - {sportConfig.label}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedTeam?.id || ''}
              onChange={(e) => {
                const team = teams.find(t => t.id === e.target.value);
                setSelectedTeam(team || null);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>

            <Link
              href="/dashboard/players/add"
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Player
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="Squad Size"
            value={squadStats.total}
            icon={Users}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            label="Available"
            value={squadStats.available}
            icon={CheckCircle}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard
            label="Injured"
            value={squadStats.injured}
            icon={Heart}
            color="bg-gradient-to-br from-red-500 to-red-600"
          />
          <StatCard
            label="Suspended"
            value={squadStats.suspended}
            icon={Shield}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
          />
          <StatCard
            label="Avg Rating"
            value={squadStats.avgRating.toFixed(1)}
            icon={Star}
            color="bg-gradient-to-br from-gold-500 to-orange-500"
          />
          <StatCard
            label="Other Teams"
            value={otherTeamPlayers.length}
            subtext="Available to call up"
            icon={UserPlus}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="INJURED">Injured</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            {/* Position Filter */}
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Positions</option>
              {sportConfig.positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            {/* Show Other Teams Toggle */}
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showOtherTeams}
                onChange={(e) => setShowOtherTeams(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">Show Other Teams</span>
            </label>
          </div>
        </div>

        {/* Players Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Squad List
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing {filteredPlayers.length} of {teamPlayers.length + (showOtherTeams ? otherTeamPlayers.length : 0)} players
            </span>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Players Found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Adjust filters or add players to the squad</p>
              <Link
                href="/dashboard/players/add"
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Player
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Player</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Rating</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Form</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredPlayers.map(tp => {
                    const isFromOtherTeam = !teamPlayers.some(p => p.id === tp.id);
                    return (
                      <PlayerRow
                        key={tp.id}
                        player={tp.player}
                        teamPlayer={tp}
                        sport={currentSport}
                        injury={getPlayerInjury(tp.playerId)}
                        onView={() => router.push(`/dashboard/players/${tp.playerId}`)}
                        onEdit={() => router.push(`/dashboard/players/${tp.playerId}/edit`)}
                        onCallUp={isFromOtherTeam ? () => handleCallUp(tp) : undefined}
                        isFromOtherTeam={isFromOtherTeam}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Injured Players Alert */}
        {injuries.filter(i => i.status === 'ACTIVE').length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {injuries.filter(i => i.status === 'ACTIVE').length} Player{injuries.filter(i => i.status === 'ACTIVE').length !== 1 ? 's' : ''} Currently Injured
                </h3>
                <div className="space-y-2">
                  {injuries.filter(i => i.status === 'ACTIVE').map(injury => {
                    const player = teamPlayers.find(tp => tp.playerId === injury.playerId)?.player;
                    const severityConfig = INJURY_SEVERITY_CONFIG[injury.severity];
                    return (
                      <div key={injury.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {player?.user.firstName} {player?.user.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${severityConfig.color}`}>
                              {severityConfig.label}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">{injury.type}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Expected Return</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {injury.expectedReturnDate
                              ? new Date(injury.expectedReturnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : 'TBD'
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}
    </div>
  );
}