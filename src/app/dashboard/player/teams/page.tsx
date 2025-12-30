'use client';

// ============================================================================
// 🏆 PITCHCONNECT MY TEAMS v7.5.0
// ============================================================================
// Player's team memberships and join request management
// ============================================================================

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Shield,
  Calendar,
  MapPin,
  ChevronRight,
  Star,
  Crown,
  Clock,
  Check,
  X,
  AlertCircle,
  Loader2,
  UserPlus,
  LogOut,
  MoreHorizontal,
  Activity,
  Trophy,
  Target,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Sport, SPORT_CONFIGS, formatPosition } from '@/lib/sport-config';

// ============================================================================
// TYPES
// ============================================================================

interface TeamMembership {
  id: string;
  teamId: string;
  team: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    ageGroup?: string;
    gender?: string;
    status: string;
    club: {
      id: string;
      name: string;
      sport: Sport;
      logo?: string;
      city?: string;
      country?: string;
    };
    _count: {
      players: number;
    };
  };
  position?: string;
  jerseyNumber?: number;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  joinedAt: string;
  // Stats for this team
  stats?: {
    matches: number;
    goals: number;
    assists: number;
  };
}

interface JoinRequest {
  id: string;
  teamId: string;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  message?: string;
  preferredPosition?: string;
  preferredJerseyNumber?: number;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_MEMBERSHIPS: TeamMembership[] = [
  {
    id: 'tm-1',
    teamId: 't-1',
    team: {
      id: 't-1',
      name: 'First Team',
      description: 'Senior competitive squad',
      ageGroup: 'SENIOR',
      gender: 'MALE',
      status: 'ACTIVE',
      club: {
        id: 'c-1',
        name: 'Manchester United FC',
        sport: 'FOOTBALL',
        logo: '/clubs/mufc.png',
        city: 'Manchester',
        country: 'England',
      },
      _count: { players: 25 },
    },
    position: 'LEFT_WINGER',
    jerseyNumber: 10,
    isActive: true,
    isCaptain: false,
    isViceCaptain: true,
    joinedAt: '2020-01-15T00:00:00Z',
    stats: { matches: 142, goals: 52, assists: 34 },
  },
  {
    id: 'tm-2',
    teamId: 't-2',
    team: {
      id: 't-2',
      name: 'England National Team',
      ageGroup: 'SENIOR',
      gender: 'MALE',
      status: 'ACTIVE',
      club: {
        id: 'c-2',
        name: 'England FA',
        sport: 'FOOTBALL',
        city: 'London',
        country: 'England',
      },
      _count: { players: 26 },
    },
    position: 'STRIKER',
    jerseyNumber: 11,
    isActive: true,
    isCaptain: false,
    isViceCaptain: false,
    joinedAt: '2016-05-27T00:00:00Z',
    stats: { matches: 57, goals: 16, assists: 7 },
  },
];

const MOCK_JOIN_REQUESTS: JoinRequest[] = [
  {
    id: 'jr-1',
    teamId: 't-3',
    team: {
      id: 't-3',
      name: 'All-Stars XI',
      club: {
        id: 'c-3',
        name: 'Charity League',
        sport: 'FOOTBALL',
      },
    },
    status: 'PENDING',
    message: 'Would love to participate in charity matches',
    preferredPosition: 'STRIKER',
    preferredJerseyNumber: 10,
    createdAt: '2024-12-20T00:00:00Z',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function PlayerTeamsPage() {
  const { data: session } = useSession();
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'requests'>('teams');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API calls
        await new Promise((resolve) => setTimeout(resolve, 500));
        setMemberships(MOCK_MEMBERSHIPS);
        setJoinRequests(MOCK_JOIN_REQUESTS);
      } catch (err) {
        setError('Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate time with team
  const getTimeWithTeam = (joinedAt: string) => {
    const joined = new Date(joinedAt);
    const now = new Date();
    const years = now.getFullYear() - joined.getFullYear();
    const months = now.getMonth() - joined.getMonth();

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}`;
  };

  // Cancel join request
  const handleCancelRequest = async (requestId: string) => {
    try {
      // TODO: API call to cancel request
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error('Failed to cancel request');
    }
  };

  // Render team membership card
  const renderMembershipCard = (membership: TeamMembership) => {
    const sport = membership.team.club.sport;
    const sportConfig = SPORT_CONFIGS[sport];

    return (
      <div
        key={membership.id}
        className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
      >
        {/* Header with gradient */}
        <div className={cn('h-2 bg-gradient-to-r', sportConfig.gradientFrom, sportConfig.gradientTo)} />

        <div className="p-6">
          {/* Team info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden">
                {membership.team.club.logo ? (
                  <Image
                    src={membership.team.club.logo}
                    alt={membership.team.club.name}
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                ) : (
                  <Shield className="h-7 w-7 text-zinc-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{membership.team.name}</h3>
                <p className="text-sm text-zinc-400">{membership.team.club.name}</p>
              </div>
            </div>

            {/* Role badges */}
            <div className="flex items-center gap-2">
              {membership.isCaptain && (
                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs font-bold flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Captain
                </span>
              )}
              {membership.isViceCaptain && (
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-bold flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Vice-Captain
                </span>
              )}
            </div>
          </div>

          {/* Sport & Position */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                sportConfig.bgColor,
                sportConfig.textColor
              )}
            >
              <sportConfig.icon className="h-3 w-3" />
              {sportConfig.shortName}
            </div>
            {membership.position && (
              <span className="text-sm text-zinc-300 flex items-center gap-1">
                <Target className="h-3 w-3 text-zinc-500" />
                {formatPosition(membership.position, sport)}
              </span>
            )}
            {membership.jerseyNumber && (
              <span className="text-sm text-zinc-300 flex items-center gap-1">
                <span className="text-zinc-500">#</span>
                {membership.jerseyNumber}
              </span>
            )}
          </div>

          {/* Stats */}
          {membership.stats && (
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-zinc-800/50 rounded-lg">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{membership.stats.matches}</p>
                <p className="text-xs text-zinc-500">Matches</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{membership.stats.goals}</p>
                <p className="text-xs text-zinc-500">{sportConfig.primaryStat}</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{membership.stats.assists}</p>
                <p className="text-xs text-zinc-500">{sportConfig.secondaryStat}</p>
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between text-sm text-zinc-500 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {getTimeWithTeam(membership.joinedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {membership.team._count.players} players
            </span>
            {membership.team.club.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {membership.team.club.city}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/teams/${membership.teamId}`}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium text-center transition-colors"
            >
              View Team
            </Link>
            <Link
              href={`/dashboard/teams/${membership.teamId}/matches`}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Trophy className="h-4 w-4" />
              Matches
            </Link>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render join request card
  const renderJoinRequestCard = (request: JoinRequest) => {
    const sport = request.team.club.sport;
    const sportConfig = SPORT_CONFIGS[sport];

    const statusConfig: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
      PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Clock },
      APPROVED: { bg: 'bg-green-500/10', text: 'text-green-400', icon: Check },
      REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400', icon: X },
      CANCELLED: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', icon: X },
      EXPIRED: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', icon: AlertCircle },
    };

    const status = statusConfig[request.status] || statusConfig.PENDING;
    const StatusIcon = status.icon;

    return (
      <div
        key={request.id}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden">
              {request.team.club.logo ? (
                <Image
                  src={request.team.club.logo}
                  alt={request.team.club.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <Shield className="h-6 w-6 text-zinc-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">{request.team.name}</h3>
              <p className="text-sm text-zinc-400">{request.team.club.name}</p>
            </div>
          </div>

          <span className={cn('px-2 py-1 rounded text-xs font-medium flex items-center gap-1', status.bg, status.text)}>
            <StatusIcon className="h-3 w-3" />
            {request.status}
          </span>
        </div>

        {/* Request details */}
        <div className="space-y-2 mb-4">
          {request.preferredPosition && (
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Position:</span>{' '}
              {formatPosition(request.preferredPosition, sport)}
            </p>
          )}
          {request.preferredJerseyNumber && (
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Jersey #:</span> {request.preferredJerseyNumber}
            </p>
          )}
          {request.message && (
            <p className="text-sm text-zinc-300 italic">"{request.message}"</p>
          )}
        </div>

        {/* Rejection reason */}
        {request.status === 'REJECTED' && request.rejectionReason && (
          <div className="mb-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
            <p className="text-sm text-red-400">
              <span className="font-medium">Reason:</span> {request.rejectionReason}
            </p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Requested {new Date(request.createdAt).toLocaleDateString()}
          </span>

          {request.status === 'PENDING' && (
            <button
              onClick={() => handleCancelRequest(request.id)}
              className="px-3 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
            >
              Cancel Request
            </button>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading your teams...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = joinRequests.filter((r) => r.status === 'PENDING');

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-green-500" />
                My Teams
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                {memberships.length} team{memberships.length !== 1 ? 's' : ''}
                {pendingRequests.length > 0 && (
                  <span className="ml-2 text-yellow-400">
                    • {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>

            <Link
              href="/dashboard/player/browse-teams"
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium transition-all hover:shadow-lg flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Browse Teams
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6">
            <button
              onClick={() => setActiveTab('teams')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'teams'
                  ? 'bg-green-500 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Users className="h-4 w-4 inline mr-2" />
              My Teams ({memberships.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                activeTab === 'requests'
                  ? 'bg-green-500 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Clock className="h-4 w-4" />
              Join Requests
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Teams tab */}
        {activeTab === 'teams' && (
          <>
            {memberships.length === 0 ? (
              <div className="text-center py-20">
                <Users className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Team Memberships</h3>
                <p className="text-zinc-400 mb-6">You haven't joined any teams yet.</p>
                <Link
                  href="/dashboard/player/browse-teams"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium"
                >
                  <UserPlus className="h-4 w-4" />
                  Browse Teams
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {memberships.map(renderMembershipCard)}
              </div>
            )}
          </>
        )}

        {/* Requests tab */}
        {activeTab === 'requests' && (
          <>
            {joinRequests.length === 0 ? (
              <div className="text-center py-20">
                <Clock className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Join Requests</h3>
                <p className="text-zinc-400 mb-6">You don't have any pending join requests.</p>
                <Link
                  href="/dashboard/player/browse-teams"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium"
                >
                  <UserPlus className="h-4 w-4" />
                  Find Teams to Join
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {joinRequests.map(renderJoinRequestCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
