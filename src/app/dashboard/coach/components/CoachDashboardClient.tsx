// =============================================================================
// 🏆 PITCHCONNECT - COACH DASHBOARD CLIENT v3.0 (Multi-Sport Enterprise Edition)
// =============================================================================
// Path: /dashboard/coach/components/CoachDashboardClient.tsx
// Access: COACH, HEAD_COACH, ASSISTANT_COACH, GOALKEEPING_COACH, PERFORMANCE_COACH
// 
// FEATURES:
// ✅ Multi-sport support with sport-specific terminology
// ✅ Team management overview
// ✅ Squad roster with player stats
// ✅ Recent and upcoming matches
// ✅ Training sessions management
// ✅ Job opportunities (if open to opportunities)
// ✅ Performance metrics
// ✅ Schema-aligned with Coach, ClubMember, Team, Match models
// ✅ Real-time filtering by team
// ✅ Dark mode + responsive design
// =============================================================================

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Plus,
  Trophy,
  Calendar,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  Briefcase,
  Shield,
  Target,
  Activity,
  ChevronRight,
  Filter,
  Bell,
  Award,
  Dumbbell,
  FileText,
  Settings,
  Eye,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type Sport = 
  | 'FOOTBALL' | 'NETBALL' | 'RUGBY' | 'CRICKET' | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type Position = string;

type ClubMemberRole =
  | 'OWNER' | 'MANAGER' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'PLAYER'
  | 'STAFF' | 'TREASURER' | 'SCOUT' | 'ANALYST' | 'MEDICAL_STAFF'
  | 'PHYSIOTHERAPIST' | 'NUTRITIONIST' | 'PSYCHOLOGIST' | 'PERFORMANCE_COACH'
  | 'GOALKEEPING_COACH' | 'KIT_MANAGER' | 'MEDIA_OFFICER';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  roles: string[];
}

interface Coach {
  id: string;
  userId: string;
  coachType: string;
  specialization: string[];
  certifications: string[];
  yearsExperience?: number | null;
  isVerified: boolean;
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  overallRating?: number | null;
  totalPlayersCoached: number;
  matchesManaged: number;
  winRate?: number | null;
  isOpenToOpportunities: boolean;
}

interface Club {
  id: string;
  name: string;
  shortName?: string | null;
  logo?: string | null;
  sport: Sport;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

interface Team {
  id: string;
  name: string;
  clubId: string;
  ageGroup?: string | null;
  gender?: string | null;
  status: string;
  club: Club;
  _count?: {
    players: number;
  };
}

interface ClubMembership {
  id: string;
  clubId: string;
  role: ClubMemberRole;
  isActive: boolean;
  club: Club;
}

interface TeamPlayer {
  id: string;
  playerId: string;
  position?: Position | null;
  jerseyNumber?: number | null;
  isActive: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  player: {
    id: string;
    primaryPosition?: Position | null;
    overallRating?: number | null;
    formRating?: number | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
    };
  };
}

interface SquadData {
  teamId: string;
  teamName: string;
  sport: Sport;
  players: TeamPlayer[];
}

interface Match {
  id: string;
  homeClubId: string;
  awayClubId: string;
  homeTeam: {
    id: string;
    name: string;
    logo?: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logo?: string | null;
  };
  homeScore?: number | null;
  awayScore?: number | null;
  kickOffTime: string;
  status: string;
  venue?: string | null;
}

interface TrainingSession {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  intensity: string;
  category: string;
  location?: string | null;
  status: string;
  _count?: {
    attendance: number;
  };
}

interface JobPosting {
  id: string;
  title: string;
  clubId: string;
  club: {
    name: string;
    logo?: string | null;
    sport: Sport;
    city?: string | null;
  };
  category: string;
  employmentType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  deadline?: string | null;
  isRemote: boolean;
}

interface CoachDashboardClientProps {
  data: {
    user: User;
    coach: Coach;
    clubMemberships: ClubMembership[];
    teams: Team[];
    squadData: SquadData[];
    recentMatches: Match[];
    upcomingMatches: Match[];
    trainingSessions: TrainingSession[];
    jobOpportunities?: JobPosting[];
  };
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

const COACH_TYPE_LABELS: Record<string, string> = {
  HEAD_COACH: 'Head Coach',
  ASSISTANT_COACH: 'Assistant Coach',
  GOALKEEPING_COACH: 'Goalkeeper Coach',
  PERFORMANCE_COACH: 'Performance Coach',
  FITNESS_COACH: 'Fitness Coach',
  YOUTH_COACH: 'Youth Coach',
  TECHNICAL_COACH: 'Technical Coach',
};

const INTENSITY_COLORS: Record<string, string> = {
  RECOVERY: 'bg-blue-500/20 text-blue-400',
  LOW: 'bg-green-500/20 text-green-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  MAXIMUM: 'bg-red-500/20 text-red-400',
  COMPETITIVE: 'bg-purple-500/20 text-purple-400',
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color = 'text-white',
  subtext,
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType; 
  color?: string;
  subtext?: string;
}) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
      <div className="p-2.5 rounded-lg bg-slate-700/50">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </div>
  </div>
);

const TeamFilterDropdown = ({
  teams,
  selectedTeams,
  onChange,
}: {
  teams: Array<{ id: string; name: string; sport: Sport }>;
  selectedTeams: string[];
  onChange: (teams: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      onChange(selectedTeams.filter(id => id !== teamId));
    } else {
      onChange([...selectedTeams, teamId]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
      >
        <Filter className="h-4 w-4 text-slate-400" />
        <span className="text-white text-sm">
          {selectedTeams.length === 0 ? 'All Teams' : `${selectedTeams.length} Selected`}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-600 bg-slate-800 shadow-lg z-50">
          <div className="p-2">
            <button
              onClick={() => { onChange([]); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg"
            >
              Show All Teams
            </button>
            <div className="border-t border-slate-700 my-1" />
            {teams.map(team => {
              const sportConfig = SPORT_CONFIG[team.sport];
              return (
                <label key={team.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => handleToggle(team.id)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-lg">{sportConfig?.icon}</span>
                  <span className="text-sm text-white">{team.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const PlayerRow = ({ player, sport }: { player: TeamPlayer; sport: Sport }) => {
  const sportConfig = SPORT_CONFIG[sport];
  
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
      {/* Jersey Number */}
      <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center text-sm font-bold text-white">
        {player.jerseyNumber ?? '-'}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-orange-500 flex items-center justify-center text-white font-bold overflow-hidden">
        {player.player.user.avatar ? (
          <Image src={player.player.user.avatar} alt="" width={40} height={40} className="object-cover" />
        ) : (
          `${player.player.user.firstName[0]}${player.player.user.lastName[0]}`
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-white truncate">
            {player.player.user.firstName} {player.player.user.lastName}
          </p>
          {player.isCaptain && <span className="px-1 py-0.5 rounded text-xs font-bold bg-gold-500/20 text-gold-400">C</span>}
          {player.isViceCaptain && <span className="px-1 py-0.5 rounded text-xs font-bold bg-slate-500/20 text-slate-300">VC</span>}
        </div>
        <p className="text-xs text-slate-400">
          {player.position || player.player.primaryPosition || 'Unassigned'}
        </p>
      </div>

      {/* Rating */}
      {player.player.overallRating && (
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-3.5 w-3.5 text-gold-400" />
          <span className="text-gold-400 font-medium">{player.player.overallRating.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, userClubIds }: { match: Match; userClubIds: string[] }) => {
  const isHome = userClubIds.includes(match.homeClubId);
  const isFinished = match.status === 'FINISHED';
  const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
  
  let result = '';
  if (isFinished && match.homeScore !== null && match.awayScore !== null) {
    const ourScore = isHome ? match.homeScore : match.awayScore;
    const theirScore = isHome ? match.awayScore : match.homeScore;
    result = ourScore > theirScore ? 'W' : ourScore < theirScore ? 'L' : 'D';
  }

  const resultColors = { W: 'bg-emerald-500', L: 'bg-red-500', D: 'bg-amber-500' };

  return (
    <div className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {result && (
            <div className={`w-7 h-7 rounded-full ${resultColors[result as keyof typeof resultColors]} flex items-center justify-center text-white font-bold text-xs`}>
              {result}
            </div>
          )}
          {isLive && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 animate-pulse">
              LIVE
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          {new Date(match.kickOffTime).toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short'
          })}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 text-right pr-3">
          <p className="font-medium text-white text-sm">{match.homeTeam.name}</p>
        </div>
        <div className="px-3 py-1 rounded-lg bg-slate-600/50 min-w-[60px] text-center">
          {isFinished || isLive ? (
            <span className="font-bold text-white">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </span>
          ) : (
            <span className="text-slate-400 text-sm">vs</span>
          )}
        </div>
        <div className="flex-1 pl-3">
          <p className="font-medium text-white text-sm">{match.awayTeam.name}</p>
        </div>
      </div>

      {match.venue && (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
          <MapPin className="h-3 w-3" />
          {match.venue}
        </div>
      )}
    </div>
  );
};

const TrainingCard = ({ session }: { session: TrainingSession }) => {
  const intensityColor = INTENSITY_COLORS[session.intensity] || 'bg-slate-500/20 text-slate-400';
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  return (
    <Link href={`/dashboard/training/${session.id}`}>
      <div className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-white">{session.name}</p>
            <p className="text-xs text-slate-400">{session.category.replace(/_/g, ' ')}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${intensityColor}`}>
            {session.intensity}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {startTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span>{duration} min</span>
        </div>

        {session.location && (
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            {session.location}
          </div>
        )}
      </div>
    </Link>
  );
};

const JobCard = ({ job }: { job: JobPosting }) => {
  const sportConfig = SPORT_CONFIG[job.club.sport];

  return (
    <Link href={`/dashboard/jobs/${job.id}`}>
      <div className="p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all cursor-pointer border border-slate-600/50 hover:border-gold-500/30">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${sportConfig?.color || 'from-gold-500 to-orange-500'} flex items-center justify-center`}>
            {job.club.logo ? (
              <Image src={job.club.logo} alt="" width={32} height={32} className="rounded object-cover" />
            ) : (
              <span>{sportConfig?.icon}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{job.title}</p>
            <p className="text-sm text-slate-400">{job.club.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded-full bg-slate-600/50">{job.employmentType.replace(/_/g, ' ')}</span>
          {job.salaryMin && job.salaryMax && (
            <span>{job.currency} {(job.salaryMin / 1000).toFixed(0)}k - {(job.salaryMax / 1000).toFixed(0)}k</span>
          )}
          {job.isRemote && <span className="text-emerald-400">Remote</span>}
        </div>

        {job.deadline && (
          <p className="text-xs text-amber-400 mt-2">
            Apply by {new Date(job.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>
    </Link>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CoachDashboardClient({ data }: CoachDashboardClientProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const { user, coach, clubMemberships, teams, squadData, recentMatches, upcomingMatches, trainingSessions, jobOpportunities } = data;

  // Get user's club IDs for match result calculation
  const userClubIds = useMemo(() => 
    clubMemberships.filter(m => m.isActive).map(m => m.clubId),
    [clubMemberships]
  );

  // Filtered data based on selected teams
  const filteredSquadData = useMemo(() => {
    if (selectedTeams.length === 0) return squadData;
    return squadData.filter(team => selectedTeams.includes(team.teamId));
  }, [squadData, selectedTeams]);

  const filteredRecentMatches = useMemo(() => {
    if (selectedTeams.length === 0) return recentMatches;
    // Filter by clubs that contain selected teams
    const relevantClubIds = teams.filter(t => selectedTeams.includes(t.id)).map(t => t.clubId);
    return recentMatches.filter(match =>
      relevantClubIds.includes(match.homeClubId) || relevantClubIds.includes(match.awayClubId)
    );
  }, [recentMatches, selectedTeams, teams]);

  const filteredUpcomingMatches = useMemo(() => {
    if (selectedTeams.length === 0) return upcomingMatches;
    const relevantClubIds = teams.filter(t => selectedTeams.includes(t.id)).map(t => t.clubId);
    return upcomingMatches.filter(match =>
      relevantClubIds.includes(match.homeClubId) || relevantClubIds.includes(match.awayClubId)
    );
  }, [upcomingMatches, selectedTeams, teams]);

  const totalPlayers = useMemo(() => 
    filteredSquadData.reduce((acc, team) => acc + team.players.length, 0),
    [filteredSquadData]
  );

  // Calculate quick stats
  const upcomingTrainingCount = trainingSessions.filter(s => new Date(s.startTime) > new Date()).length;
  const coachTypeLabel = COACH_TYPE_LABELS[coach.coachType] || coach.coachType.replace(/_/g, ' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {user.avatar ? (
                <Image src={user.avatar} alt="" width={64} height={64} className="object-cover" />
              ) : (
                `${user.firstName[0]}${user.lastName[0]}`
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Welcome, {user.firstName}
                </h1>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold rounded-full">
                  {coachTypeLabel}
                </span>
                {coach.isVerified && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-slate-400 mt-1">
                Managing {teams.length} {teams.length === 1 ? 'team' : 'teams'} across {clubMemberships.length} {clubMemberships.length === 1 ? 'club' : 'clubs'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <TeamFilterDropdown
              teams={teams.map(t => ({ id: t.id, name: t.name, sport: t.club.sport }))}
              selectedTeams={selectedTeams}
              onChange={setSelectedTeams}
            />
            <Link href="/dashboard/training/create" className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              Schedule Training
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Total Players" value={totalPlayers} icon={Users} color="text-blue-400" />
          <StatCard label="Teams" value={teams.length} icon={Shield} color="text-purple-400" />
          <StatCard label="Matches" value={coach.matchesManaged} icon={Trophy} color="text-gold-400" />
          <StatCard 
            label="Win Rate" 
            value={coach.winRate ? `${Math.round(coach.winRate)}%` : '-'} 
            icon={TrendingUp} 
            color="text-emerald-400" 
          />
          <StatCard label="Upcoming Training" value={upcomingTrainingCount} icon={Dumbbell} color="text-cyan-400" />
          <StatCard 
            label="Rating" 
            value={coach.overallRating?.toFixed(1) || '-'} 
            icon={Star} 
            color="text-amber-400" 
          />
        </div>

        {/* Teams Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => {
            const sportConfig = SPORT_CONFIG[team.club.sport];
            return (
              <Link key={team.id} href={`/dashboard/clubs/${team.clubId}/teams/${team.id}`}>
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-gold-500/50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sportConfig?.color || 'from-gold-500 to-orange-500'} flex items-center justify-center`}>
                        <span className="text-2xl">{sportConfig?.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{team.name}</h3>
                        <p className="text-xs text-slate-400">{team.club.name}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{team.ageGroup || 'Open'}</span>
                    <span>•</span>
                    <span>{team.gender || 'Mixed'}</span>
                    <span>•</span>
                    <span>{team._count?.players || 0} players</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Squad Overview */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Squad Overview
              </h2>
              <Link href="/dashboard/players" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {filteredSquadData.length > 0 ? (
                <div className="space-y-4">
                  {filteredSquadData.map(team => (
                    <div key={team.teamId}>
                      <p className="text-sm font-medium text-gold-400 mb-2 flex items-center gap-2">
                        <span>{SPORT_CONFIG[team.sport]?.icon}</span>
                        {team.teamName} ({team.players.length})
                      </p>
                      <div className="space-y-2">
                        {team.players.slice(0, 5).map(player => (
                          <PlayerRow key={player.id} player={player} sport={team.sport} />
                        ))}
                        {team.players.length > 5 && (
                          <p className="text-xs text-slate-500 text-center py-2">
                            +{team.players.length - 5} more players
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No squad data available</p>
              )}
            </div>
          </div>

          {/* Upcoming Training */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-cyan-400" />
                Training Sessions
              </h2>
              <Link href="/dashboard/training" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {trainingSessions.length > 0 ? (
                trainingSessions.slice(0, 5).map(session => (
                  <TrainingCard key={session.id} session={session} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No training sessions scheduled</p>
                  <Link href="/dashboard/training/create" className="text-gold-400 text-sm hover:text-gold-300 mt-2 inline-block">
                    Schedule Training
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gold-400" />
                Recent Results
              </h2>
              <Link href="/dashboard/matches" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {filteredRecentMatches.length > 0 ? (
                filteredRecentMatches.slice(0, 5).map(match => (
                  <MatchCard key={match.id} match={match} userClubIds={userClubIds} />
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">No recent matches</p>
              )}
            </div>
          </div>

          {/* Upcoming Fixtures */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Upcoming Fixtures
              </h2>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {filteredUpcomingMatches.length > 0 ? (
                filteredUpcomingMatches.slice(0, 5).map(match => (
                  <MatchCard key={match.id} match={match} userClubIds={userClubIds} />
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">No upcoming fixtures</p>
              )}
            </div>
          </div>
        </div>

        {/* Job Opportunities (if coach is open to opportunities) */}
        {coach.isOpenToOpportunities && jobOpportunities && jobOpportunities.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-gold-500/30">
            <div className="border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gold-400" />
                Job Opportunities
                <span className="px-2 py-0.5 rounded-full text-xs bg-gold-500/20 text-gold-400">
                  {jobOpportunities.length} New
                </span>
              </h2>
              <Link href="/dashboard/jobs" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
                Browse All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobOpportunities.slice(0, 6).map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/analytics" className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
            <Activity className="h-6 w-6 text-emerald-400" />
            <span className="text-white font-medium">Analytics</span>
          </Link>
          <Link href="/dashboard/timesheets" className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
            <FileText className="h-6 w-6 text-blue-400" />
            <span className="text-white font-medium">Timesheets</span>
          </Link>
          <Link href="/dashboard/qualifications" className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
            <Award className="h-6 w-6 text-purple-400" />
            <span className="text-white font-medium">Qualifications</span>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-gold-500/50 transition-all">
            <Settings className="h-6 w-6 text-slate-400" />
            <span className="text-white font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CoachDashboardClient;