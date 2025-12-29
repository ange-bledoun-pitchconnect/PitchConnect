// =============================================================================
// 🏢 PITCHCONNECT - CLUB DETAILS PAGE v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/clubs/[clubId]
// Access: Club members (view), Managers/Owners (edit)
// 
// FEATURES:
// ✅ Multi-sport support with sport-specific features
// ✅ Club overview with statistics
// ✅ Teams management with join request status
// ✅ Squad roster (ClubMember model)
// ✅ Recent matches
// ✅ Job postings integration
// ✅ Schema-aligned with Club, Team, ClubMember, Match models
// ✅ Role-based permissions
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Building2,
  Users,
  Trophy,
  Calendar,
  MapPin,
  Globe,
  Settings,
  Plus,
  MoreVertical,
  Shield,
  Star,
  TrendingUp,
  UserPlus,
  Briefcase,
  Bell,
  Edit,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type TeamType =
  | 'PROFESSIONAL' | 'SEMI_PROFESSIONAL' | 'AMATEUR' | 'ACADEMY'
  | 'YOUTH' | 'RECREATIONAL' | 'UNIVERSITY' | 'SCHOOL';

type ClubMemberRole =
  | 'OWNER' | 'MANAGER' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'PLAYER'
  | 'STAFF' | 'TREASURER' | 'SCOUT' | 'ANALYST' | 'MEDICAL_STAFF'
  | 'PHYSIOTHERAPIST' | 'NUTRITIONIST' | 'PSYCHOLOGIST' | 'PERFORMANCE_COACH'
  | 'GOALKEEPING_COACH' | 'KIT_MANAGER' | 'MEDIA_OFFICER';

interface ClubStats {
  totalMatches: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  winRate: number | null;
  currentStreak: number;
  streakType: string | null;
}

interface Club {
  id: string;
  name: string;
  slug: string;
  shortName?: string | null;
  description?: string | null;
  logo?: string | null;
  banner?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  foundedYear?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  venue?: string | null;
  venueCapacity?: number | null;
  sport: Sport;
  teamType: TeamType;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  isVerified: boolean;
  isPublic: boolean;
  acceptingPlayers: boolean;
  acceptingStaff: boolean;
  status: string;
  managerId: string;
  ownerId?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  createdAt: string;
  _count?: {
    teams: number;
    members: number;
    jobPostings: number;
  };
  aggregateStats?: ClubStats | null;
}

interface Team {
  id: string;
  name: string;
  ageGroup?: string | null;
  gender?: string | null;
  status: string;
  acceptingJoinRequests: boolean;
  _count: {
    players: number;
    joinRequests: number;
  };
}

interface ClubMember {
  id: string;
  userId: string;
  role: ClubMemberRole;
  isActive: boolean;
  isCaptain: boolean;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  };
}

interface Match {
  id: string;
  homeClubId: string;
  awayClubId: string;
  homeTeam: { id: string; name: string; logo?: string | null };
  awayTeam: { id: string; name: string; logo?: string | null };
  homeScore?: number | null;
  awayScore?: number | null;
  kickOffTime: string;
  status: string;
  venue?: string | null;
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

const TEAM_TYPE_LABELS: Record<TeamType, string> = {
  PROFESSIONAL: 'Professional',
  SEMI_PROFESSIONAL: 'Semi-Professional',
  AMATEUR: 'Amateur',
  ACADEMY: 'Academy',
  YOUTH: 'Youth',
  RECREATIONAL: 'Recreational',
  UNIVERSITY: 'University',
  SCHOOL: 'School',
};

const ROLE_CONFIG: Record<ClubMemberRole, { label: string; color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  MANAGER: { label: 'Manager', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  HEAD_COACH: { label: 'Head Coach', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  ASSISTANT_COACH: { label: 'Assistant Coach', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  PLAYER: { label: 'Player', color: 'bg-gold-500/20 text-gold-400 border-gold-500/30' },
  STAFF: { label: 'Staff', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  TREASURER: { label: 'Treasurer', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  SCOUT: { label: 'Scout', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  ANALYST: { label: 'Analyst', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  MEDICAL_STAFF: { label: 'Medical Staff', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  PHYSIOTHERAPIST: { label: 'Physiotherapist', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  NUTRITIONIST: { label: 'Nutritionist', color: 'bg-lime-500/20 text-lime-400 border-lime-500/30' },
  PSYCHOLOGIST: { label: 'Psychologist', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  PERFORMANCE_COACH: { label: 'Performance Coach', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  GOALKEEPING_COACH: { label: 'GK Coach', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  KIT_MANAGER: { label: 'Kit Manager', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  MEDIA_OFFICER: { label: 'Media Officer', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
};

// =============================================================================
// TOAST COMPONENT
// =============================================================================

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
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

const StatCard = ({ label, value, icon: Icon, color = 'text-white' }: { label: string; value: string | number; icon: React.ElementType; color?: string }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-slate-700/50">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  </div>
);

const TeamCard = ({ team, clubId, sport }: { team: Team; clubId: string; sport: Sport }) => {
  const sportConfig = SPORT_CONFIG[sport];
  
  return (
    <Link href={`/dashboard/clubs/${clubId}/teams/${team.id}`}>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-gold-500/50 transition-all cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${sportConfig.color} flex items-center justify-center`}>
              <span className="text-lg">{sportConfig.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-gold-400 transition-colors">{team.name}</h3>
              <p className="text-xs text-slate-400">
                {team.ageGroup && `${team.ageGroup} • `}{team.gender || 'Mixed'}
              </p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            team.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
          }`}>
            {team.status}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            <Users className="h-4 w-4 inline mr-1" />
            {team._count.players} players
          </span>
          {team.acceptingJoinRequests && team._count.joinRequests > 0 && (
            <span className="text-gold-400 flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {team._count.joinRequests} requests
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const MemberRow = ({ member, canManage }: { member: ClubMember; canManage: boolean }) => {
  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.STAFF;
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-orange-500 flex items-center justify-center text-white font-bold">
          {member.user.avatar ? (
            <Image src={member.user.avatar} alt="" width={40} height={40} className="rounded-full object-cover" />
          ) : (
            `${member.user.firstName[0]}${member.user.lastName[0]}`
          )}
        </div>
        <div>
          <p className="font-medium text-white">
            {member.user.firstName} {member.user.lastName}
            {member.isCaptain && <Star className="h-3 w-3 inline ml-1 text-gold-400" />}
          </p>
          <p className="text-xs text-slate-400">{member.user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}>
          {roleConfig.label}
        </span>
        {canManage && (
          <button className="p-1 rounded hover:bg-slate-600 transition-colors">
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

const MatchRow = ({ match, clubId }: { match: Match; clubId: string }) => {
  const isHome = match.homeClubId === clubId;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const isFinished = match.status === 'FINISHED';
  const score = isFinished ? `${match.homeScore} - ${match.awayScore}` : 'vs';
  
  let result = '';
  if (isFinished && match.homeScore !== null && match.awayScore !== null) {
    const ourScore = isHome ? match.homeScore : match.awayScore;
    const theirScore = isHome ? match.awayScore : match.homeScore;
    result = ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'D';
  }
  
  const resultColors = { W: 'bg-emerald-500', L: 'bg-red-500', D: 'bg-amber-500' };
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-3">
        {result && (
          <div className={`w-8 h-8 rounded-full ${resultColors[result as keyof typeof resultColors]} flex items-center justify-center text-white font-bold text-sm`}>
            {result}
          </div>
        )}
        <div>
          <p className="font-medium text-white">
            {isHome ? 'vs' : '@'} {opponent.name}
          </p>
          <p className="text-xs text-slate-400">
            {new Date(match.kickOffTime).toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric', month: 'short'
            })}
            {match.venue && ` • ${match.venue}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isFinished ? 'text-white' : 'text-slate-400'}`}>
          {score}
        </p>
        <p className={`text-xs ${
          match.status === 'LIVE' ? 'text-red-400' : 
          match.status === 'SCHEDULED' ? 'text-blue-400' : 'text-slate-500'
        }`}>
          {match.status}
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const clubId = params.clubId as string;
  const abortControllerRef = useRef<AbortController | null>(null);

  // State
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'squad' | 'matches' | 'jobs'>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast utility
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Fetch data
  const fetchClubData = useCallback(async () => {
    try {
      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      const [clubRes, teamsRes, membersRes, matchesRes] = await Promise.all([
        fetch(`/api/clubs/${clubId}`, { signal: abortControllerRef.current.signal }),
        fetch(`/api/clubs/${clubId}/teams`, { signal: abortControllerRef.current.signal }),
        fetch(`/api/clubs/${clubId}/members`, { signal: abortControllerRef.current.signal }),
        fetch(`/api/clubs/${clubId}/matches?limit=10`, { signal: abortControllerRef.current.signal }),
      ]);

      if (!clubRes.ok) throw new Error('Failed to fetch club');

      const clubData = await clubRes.json();
      const teamsData = await teamsRes.json();
      const membersData = await membersRes.json();
      const matchesData = await matchesRes.json();

      setClub(clubData.club || clubData);
      setTeams(Array.isArray(teamsData.teams) ? teamsData.teams : Array.isArray(teamsData) ? teamsData : []);
      setMembers(Array.isArray(membersData.members) ? membersData.members : Array.isArray(membersData) ? membersData : []);
      
      const allMatches = Array.isArray(matchesData.matches) ? matchesData.matches : Array.isArray(matchesData) ? matchesData : [];
      const now = new Date();
      setRecentMatches(allMatches.filter((m: Match) => new Date(m.kickOffTime) < now).slice(0, 5));
      setUpcomingMatches(allMatches.filter((m: Match) => new Date(m.kickOffTime) >= now).slice(0, 5));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      showToast('Failed to load club details', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [clubId, showToast]);

  useEffect(() => {
    if (clubId) fetchClubData();
    return () => abortControllerRef.current?.abort();
  }, [clubId, fetchClubData]);

  // Permissions
  const canEdit = useMemo(() => {
    if (!session?.user?.id || !club) return false;
    if (session.user.isSuperAdmin) return true;
    if (session.user.id === club.ownerId || session.user.id === club.managerId) return true;
    const userMember = members.find(m => m.userId === session.user.id);
    return userMember?.role === 'OWNER' || userMember?.role === 'MANAGER';
  }, [session, club, members]);

  // Derived data
  const sportConfig = club ? SPORT_CONFIG[club.sport] : null;
  const stats = club?.aggregateStats;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading club...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Club Not Found</h1>
          <p className="text-slate-400 mb-6">{error || "The club you're looking for doesn't exist."}</p>
          <Link href="/dashboard/clubs" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-xl transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Clubs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div 
        className="relative border-b border-slate-700/50"
        style={{ 
          background: club.banner 
            ? `linear-gradient(to bottom, rgba(15,23,42,0.7), rgba(15,23,42,0.95)), url(${club.banner})` 
            : `linear-gradient(135deg, ${club.primaryColor || '#FFD700'}20, ${club.secondaryColor || '#1A1A2E'}40)`
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Link href="/dashboard/clubs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Clubs
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Club Info */}
            <div className="flex items-start gap-4">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ backgroundColor: club.primaryColor || '#FFD700' }}
              >
                {club.logo ? (
                  <Image src={club.logo} alt={club.name} width={72} height={72} className="rounded-xl object-cover" />
                ) : (
                  <span className="text-4xl">{sportConfig?.icon}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-3xl font-bold text-white">{club.name}</h1>
                  {club.isVerified && <CheckCircle className="h-5 w-5 text-blue-400" />}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${sportConfig?.color} text-white`}>
                    {sportConfig?.label}
                  </span>
                </div>
                <p className="text-slate-400 mb-2">
                  {TEAM_TYPE_LABELS[club.teamType]} • {club.city}, {club.country}
                </p>
                {club.description && (
                  <p className="text-sm text-slate-300 max-w-xl line-clamp-2">{club.description}</p>
                )}
                
                <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                  {club.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {club.venue}
                    </span>
                  )}
                  {club.foundedYear && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Est. {club.foundedYear}
                    </span>
                  )}
                  {club.website && (
                    <a href={club.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gold-400 transition-colors">
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-2">
                <Link href={`/dashboard/clubs/${clubId}/teams/create`} className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Team
                </Link>
                <Link href={`/dashboard/clubs/${clubId}/settings`} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'teams', label: 'Teams', icon: Users, count: teams.length },
              { id: 'squad', label: 'Squad', icon: Shield, count: members.length },
              { id: 'matches', label: 'Matches', icon: Trophy },
              { id: 'jobs', label: 'Jobs', icon: Briefcase, count: club._count?.jobPostings },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-gold-600 text-white' 
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard label="Teams" value={teams.length} icon={Users} color="text-blue-400" />
              <StatCard label="Members" value={members.length} icon={Shield} color="text-purple-400" />
              <StatCard label="Matches" value={stats?.totalMatches || 0} icon={Trophy} color="text-gold-400" />
              <StatCard label="Wins" value={stats?.totalWins || 0} icon={TrendingUp} color="text-emerald-400" />
              <StatCard label="Goals For" value={stats?.totalGoalsFor || 0} icon={Trophy} color="text-cyan-400" />
              <StatCard label="Win Rate" value={stats?.winRate ? `${Math.round(stats.winRate)}%` : '-'} icon={Star} color="text-amber-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Results */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gold-400" />
                  Recent Results
                </h2>
                {recentMatches.length > 0 ? (
                  <div className="space-y-2">
                    {recentMatches.map(match => (
                      <MatchRow key={match.id} match={match} clubId={clubId} />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">No recent matches</p>
                )}
              </div>

              {/* Upcoming Fixtures */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  Upcoming Fixtures
                </h2>
                {upcomingMatches.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingMatches.map(match => (
                      <MatchRow key={match.id} match={match} clubId={clubId} />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">No upcoming fixtures</p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            {canEdit && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href={`/dashboard/clubs/${clubId}/teams/create`} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
                  <UserPlus className="h-6 w-6 text-gold-400" />
                  <span className="text-white font-medium">Create Team</span>
                </Link>
                <Link href={`/dashboard/clubs/${clubId}/jobs/new`} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
                  <Briefcase className="h-6 w-6 text-blue-400" />
                  <span className="text-white font-medium">Post Job</span>
                </Link>
                <Link href={`/dashboard/analytics?clubId=${clubId}`} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                  <span className="text-white font-medium">Analytics</span>
                </Link>
                <Link href={`/dashboard/clubs/${clubId}/announcements`} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
                  <Bell className="h-6 w-6 text-purple-400" />
                  <span className="text-white font-medium">Announcements</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Teams ({teams.length})</h2>
              {canEdit && (
                <Link href={`/dashboard/clubs/${clubId}/teams/create`} className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors">
                  <Plus className="h-4 w-4" />
                  Create Team
                </Link>
              )}
            </div>
            
            {teams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <TeamCard key={team.id} team={team} clubId={clubId} sport={club.sport} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <Users className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Teams Yet</h3>
                <p className="text-slate-400 mb-6">Create your first team to get started</p>
                {canEdit && (
                  <Link href={`/dashboard/clubs/${clubId}/teams/create`} className="inline-flex items-center gap-2 px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white rounded-xl transition-colors">
                    <Plus className="h-5 w-5" />
                    Create First Team
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Squad Tab */}
        {activeTab === 'squad' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Club Members ({members.length})</h2>
              {canEdit && (
                <Link href={`/dashboard/clubs/${clubId}/members/invite`} className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Link>
              )}
            </div>

            {members.length > 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="space-y-2">
                  {members.map(member => (
                    <MemberRow key={member.id} member={member} canManage={canEdit} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <Shield className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Members Yet</h3>
                <p className="text-slate-400">Invite staff and players to join your club</p>
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Results</h2>
              {recentMatches.length > 0 ? (
                <div className="space-y-2">
                  {recentMatches.map(match => (
                    <MatchRow key={match.id} match={match} clubId={clubId} />
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No recent matches</p>
              )}
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Upcoming Fixtures</h2>
              {upcomingMatches.length > 0 ? (
                <div className="space-y-2">
                  {upcomingMatches.map(match => (
                    <MatchRow key={match.id} match={match} clubId={clubId} />
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No upcoming fixtures</p>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Job Postings</h2>
              {canEdit && (
                <Link href={`/dashboard/clubs/${clubId}/jobs/new`} className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors">
                  <Plus className="h-4 w-4" />
                  Post New Job
                </Link>
              )}
            </div>
            <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <Briefcase className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Manage Job Postings</h3>
              <p className="text-slate-400 mb-6">View and manage job postings for your club</p>
              <Link href={`/dashboard/clubs/${clubId}/jobs`} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                <Briefcase className="h-5 w-5" />
                Go to Jobs Management
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Toast Container */}
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}
    </div>
  );
}