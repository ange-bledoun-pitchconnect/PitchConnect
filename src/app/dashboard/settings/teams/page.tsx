/**
 * Clubs & Teams Settings Page - ENTERPRISE EDITION
 * Path: /dashboard/settings/teams/page.tsx
 *
 * ============================================================================
 * FEATURES (Hierarchical Clubs → Teams)
 * ============================================================================
 * ✅ Club membership management
 * ✅ Nested teams within clubs view
 * ✅ Role indicators per club/team
 * ✅ Join/leave functionality
 * ✅ Pending invitations
 * ✅ Multi-sport support
 * ✅ Dark mode support
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Users,
  Building2,
  Shield,
  Star,
  Crown,
  UserPlus,
  LogOut,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
  Mail,
  Clock,
  MapPin,
  Trophy,
  Settings,
  Plus,
  Search,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Toast System
type ToastType = 'success' | 'error' | 'info' | 'default';

const useToast = () => {
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([]);
  const addToast = useCallback((message: string, type: ToastType = 'default') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, success: (m: string) => addToast(m, 'success'), error: (m: string) => addToast(m, 'error'), info: (m: string) => addToast(m, 'info') };
};

// Types
type Sport = 'FOOTBALL' | 'RUGBY' | 'BASKETBALL' | 'CRICKET' | 'HOCKEY' | 'NETBALL';
type ClubRole = 'OWNER' | 'MANAGER' | 'COACH' | 'PLAYER' | 'PARENT' | 'STAFF';
type TeamRole = 'CAPTAIN' | 'VICE_CAPTAIN' | 'COACH' | 'PLAYER' | 'GOALKEEPER';

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  sport: Sport;
  role: TeamRole;
  memberCount: number;
  season: string;
  isActive: boolean;
}

interface Club {
  id: string;
  name: string;
  logo?: string;
  location: string;
  sports: Sport[];
  role: ClubRole;
  teams: Team[];
  memberSince: string;
  isVerified: boolean;
}

interface Invitation {
  id: string;
  clubName: string;
  teamName?: string;
  invitedBy: string;
  role: ClubRole | TeamRole;
  sentAt: string;
  expiresAt: string;
}

// Constants
const SPORT_ICONS: Record<Sport, string> = {
  FOOTBALL: '⚽',
  RUGBY: '🏉',
  BASKETBALL: '🏀',
  CRICKET: '🏏',
  HOCKEY: '🏑',
  NETBALL: '🏐',
};

const ROLE_BADGES: Record<string, { color: string; icon: React.ElementType }> = {
  OWNER: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Crown },
  MANAGER: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Settings },
  COACH: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Trophy },
  CAPTAIN: { color: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400', icon: Star },
  VICE_CAPTAIN: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Star },
  PLAYER: { color: 'bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-300', icon: Users },
  PARENT: { color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', icon: Users },
  STAFF: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: Shield },
  GOALKEEPER: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Shield },
};

// Mock Data
const MOCK_CLUBS: Club[] = [
  {
    id: '1',
    name: 'Riverside FC',
    location: 'London, UK',
    sports: ['FOOTBALL'],
    role: 'PLAYER',
    memberSince: '2023-09-01',
    isVerified: true,
    teams: [
      { id: 't1', name: 'First Team', ageGroup: 'Senior', sport: 'FOOTBALL', role: 'PLAYER', memberCount: 25, season: '2025/26', isActive: true },
      { id: 't2', name: 'Reserves', ageGroup: 'Senior', sport: 'FOOTBALL', role: 'CAPTAIN', memberCount: 22, season: '2025/26', isActive: true },
    ],
  },
  {
    id: '2',
    name: 'Metro Sports Academy',
    location: 'Manchester, UK',
    sports: ['FOOTBALL', 'RUGBY', 'BASKETBALL'],
    role: 'COACH',
    memberSince: '2024-01-15',
    isVerified: true,
    teams: [
      { id: 't3', name: 'U16 Boys Football', ageGroup: 'U16', sport: 'FOOTBALL', role: 'COACH', memberCount: 18, season: '2025/26', isActive: true },
      { id: 't4', name: 'U16 Girls Basketball', ageGroup: 'U16', sport: 'BASKETBALL', role: 'COACH', memberCount: 12, season: '2025/26', isActive: true },
      { id: 't5', name: 'U14 Rugby', ageGroup: 'U14', sport: 'RUGBY', role: 'COACH', memberCount: 20, season: '2025/26', isActive: false },
    ],
  },
  {
    id: '3',
    name: 'Sunday League United',
    location: 'Birmingham, UK',
    sports: ['FOOTBALL'],
    role: 'OWNER',
    memberSince: '2022-04-10',
    isVerified: false,
    teams: [
      { id: 't6', name: 'Main Squad', ageGroup: 'Senior', sport: 'FOOTBALL', role: 'CAPTAIN', memberCount: 16, season: '2025/26', isActive: true },
    ],
  },
];

const MOCK_INVITATIONS: Invitation[] = [
  { id: 'i1', clubName: 'City Athletics', teamName: 'Sprint Squad', invitedBy: 'Sarah Johnson', role: 'PLAYER', sentAt: '2025-12-28', expiresAt: '2026-01-04' },
  { id: 'i2', clubName: 'Northside FC', invitedBy: 'Mike Thompson', role: 'COACH', sentAt: '2025-12-27', expiresAt: '2026-01-03' },
];

// Components
const RoleBadge = ({ role }: { role: string }) => {
  const config = ROLE_BADGES[role] || ROLE_BADGES.PLAYER;
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {role}
    </Badge>
  );
};

const TeamCard = ({ team, onLeave }: { team: Team; onLeave: () => void }) => {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      team.isActive 
        ? 'border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10' 
        : 'border-neutral-200 dark:border-charcoal-600 opacity-60'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{SPORT_ICONS[team.sport]}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-charcoal-900 dark:text-white">{team.name}</p>
              <RoleBadge role={team.role} />
              {!team.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-500">
              <span>{team.ageGroup}</span>
              <span>•</span>
              <span>{team.memberCount} members</span>
              <span>•</span>
              <span>{team.season}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onLeave} className="text-red-600 hover:bg-red-50">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const ClubCard = ({ club, onLeaveClub, onLeaveTeam }: { club: Club; onLeaveClub: () => void; onLeaveTeam: (teamId: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700 overflow-hidden">
      {/* Club Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-charcoal-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Club Logo/Initial */}
            <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              {club.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-charcoal-900 dark:text-white">{club.name}</h3>
                {club.isVerified && (
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <RoleBadge role={club.role} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-charcoal-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{club.location}</span>
                <span>•</span>
                <span className="flex items-center gap-1">{club.sports.map(s => SPORT_ICONS[s]).join(' ')}</span>
                <span>•</span>
                <span>{club.teams.length} team{club.teams.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onLeaveClub(); }} className="text-red-600 hover:bg-red-50">
              Leave Club
            </Button>
            {isExpanded ? <ChevronDown className="w-5 h-5 text-charcoal-400" /> : <ChevronRight className="w-5 h-5 text-charcoal-400" />}
          </div>
        </div>
      </div>

      {/* Teams */}
      {isExpanded && club.teams.length > 0 && (
        <div className="px-4 pb-4 space-y-3 border-t border-neutral-200 dark:border-charcoal-700 pt-4">
          <p className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">Your Teams in {club.name}</p>
          {club.teams.map(team => (
            <TeamCard key={team.id} team={team} onLeave={() => onLeaveTeam(team.id)} />
          ))}
        </div>
      )}
    </Card>
  );
};

const InvitationCard = ({ invitation, onAccept, onDecline }: { invitation: Invitation; onAccept: () => void; onDecline: () => void }) => {
  const daysLeft = Math.ceil((new Date(invitation.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-900/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-charcoal-900 dark:text-white">
              {invitation.clubName}
              {invitation.teamName && <span className="text-charcoal-500 font-normal"> / {invitation.teamName}</span>}
            </p>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-400 mt-0.5">
              Invited by <span className="font-semibold">{invitation.invitedBy}</span> as <RoleBadge role={invitation.role} />
            </p>
            <p className="text-xs text-charcoal-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onDecline} variant="outline" className="border-red-300 text-red-600">
            <X className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={onAccept} className="bg-blue-600 text-white">
            <Check className="w-4 h-4 mr-1" />Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function TeamsPage() {
  const { toasts, success, error: showError, info } = useToast();

  const [clubs, setClubs] = useState(MOCK_CLUBS);
  const [invitations, setInvitations] = useState(MOCK_INVITATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLeaveClub = (clubId: string) => {
    if (!window.confirm('Leave this club and all associated teams?')) return;
    setClubs(prev => prev.filter(c => c.id !== clubId));
    success('Left club successfully');
  };

  const handleLeaveTeam = (clubId: string, teamId: string) => {
    if (!window.confirm('Leave this team?')) return;
    setClubs(prev => prev.map(c => 
      c.id === clubId ? { ...c, teams: c.teams.filter(t => t.id !== teamId) } : c
    ));
    success('Left team successfully');
  };

  const handleAcceptInvitation = (invId: string) => {
    setInvitations(prev => prev.filter(i => i.id !== invId));
    success('Invitation accepted! Welcome to the team.');
  };

  const handleDeclineInvitation = (invId: string) => {
    setInvitations(prev => prev.filter(i => i.id !== invId));
    info('Invitation declined');
  };

  const filteredClubs = clubs.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.teams.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalTeams = clubs.reduce((acc, c) => acc + c.teams.length, 0);

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white ${t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {t.message}
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white">Clubs & Teams</h2>
        <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">Manage your club memberships and team associations</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-900/40">
          <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{clubs.length}</p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Clubs</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-900/40">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{totalTeams}</p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Teams</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/20 dark:to-gold-800/20 rounded-xl border border-gold-200 dark:border-gold-900/40">
          <Trophy className="w-6 h-6 text-gold-600 dark:text-gold-400 mb-2" />
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{clubs.filter(c => ['OWNER', 'CAPTAIN'].includes(c.role) || c.teams.some(t => ['CAPTAIN', 'VICE_CAPTAIN'].includes(t.role))).length}</p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Leadership Roles</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-900/40">
          <Mail className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
          <p className="text-2xl font-bold text-charcoal-900 dark:text-white">{invitations.length}</p>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400">Pending Invites</p>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="bg-white dark:bg-charcoal-800 border-blue-200 dark:border-blue-900/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Pending Invitations
              <Badge className="bg-blue-500 text-white">{invitations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map(inv => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                onAccept={() => handleAcceptInvitation(inv.id)}
                onDecline={() => handleDeclineInvitation(inv.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search clubs and teams..."
            className="pl-10"
          />
        </div>
        <Button className="bg-gradient-to-r from-gold-500 to-orange-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Join Club
        </Button>
      </div>

      {/* Clubs List */}
      <div className="space-y-4">
        {filteredClubs.length === 0 ? (
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
              <h3 className="font-bold text-charcoal-900 dark:text-white mb-2">No clubs found</h3>
              <p className="text-charcoal-500 mb-4">Join a club to start managing your teams</p>
              <Button className="bg-gold-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Find & Join Clubs
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClubs.map(club => (
            <ClubCard
              key={club.id}
              club={club}
              onLeaveClub={() => handleLeaveClub(club.id)}
              onLeaveTeam={(teamId) => handleLeaveTeam(club.id, teamId)}
            />
          ))
        )}
      </div>
    </div>
  );
}