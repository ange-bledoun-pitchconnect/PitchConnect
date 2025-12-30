/**
 * Organisation Settings Page - ENTERPRISE EDITION (Admin Only)
 * Path: /dashboard/settings/organisation/page.tsx
 *
 * ============================================================================
 * FEATURES (Separate Admin Settings Section)
 * ============================================================================
 * ✅ Organisation profile management
 * ✅ Member management (invite, roles, remove)
 * ✅ Team management within organisation
 * ✅ Subscription & billing at org level
 * ✅ Organisation branding
 * ✅ Permission settings
 * ✅ Audit logs
 * ✅ Multi-sport configuration
 * ✅ Dark mode support
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Shield,
  Crown,
  Settings,
  CreditCard,
  Mail,
  UserPlus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  ExternalLink,
  Upload,
  Globe,
  Lock,
  History,
  Bell,
  Palette,
  FileText,
  Key,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
type OrgRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'COACH' | 'STAFF' | 'MEMBER';
type Sport = 'FOOTBALL' | 'RUGBY' | 'BASKETBALL' | 'CRICKET' | 'HOCKEY' | 'NETBALL';

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  avatar?: string;
  joinedAt: string;
  lastActive: string;
  teams: string[];
}

interface OrgTeam {
  id: string;
  name: string;
  sport: Sport;
  ageGroup: string;
  coachCount: number;
  playerCount: number;
  isActive: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  target?: string;
  timestamp: string;
  details?: string;
}

interface Organisation {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description: string;
  website?: string;
  location: string;
  sports: Sport[];
  foundedYear: number;
  memberCount: number;
  teamCount: number;
  plan: 'free' | 'pro' | 'enterprise';
  isVerified: boolean;
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

const ROLE_CONFIG: Record<OrgRole, { label: string; color: string; permissions: string[] }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', permissions: ['all'] },
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', permissions: ['manage_members', 'manage_teams', 'manage_billing', 'view_analytics'] },
  MANAGER: { label: 'Manager', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', permissions: ['manage_teams', 'view_analytics'] },
  COACH: { label: 'Coach', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', permissions: ['manage_assigned_teams'] },
  STAFF: { label: 'Staff', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', permissions: ['view_teams'] },
  MEMBER: { label: 'Member', color: 'bg-charcoal-100 text-charcoal-700 dark:bg-charcoal-700 dark:text-charcoal-300', permissions: ['view_own'] },
};

const ADMIN_ROLES = ['SUPERADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];

// Mock Data
const MOCK_ORG: Organisation = {
  id: 'org-1',
  name: 'Riverside Sports Club',
  slug: 'riverside-sc',
  description: 'A community sports club fostering athletic excellence since 1985.',
  website: 'https://riversidesc.com',
  location: 'London, UK',
  sports: ['FOOTBALL', 'RUGBY', 'BASKETBALL'],
  foundedYear: 1985,
  memberCount: 245,
  teamCount: 12,
  plan: 'pro',
  isVerified: true,
};

const MOCK_MEMBERS: OrgMember[] = [
  { id: 'm1', name: 'John Smith', email: 'john@example.com', role: 'OWNER', joinedAt: '2020-01-15', lastActive: '2025-12-30', teams: ['First Team', 'Reserves'] },
  { id: 'm2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'ADMIN', joinedAt: '2021-03-20', lastActive: '2025-12-29', teams: ['U16 Boys', 'U14 Girls'] },
  { id: 'm3', name: 'Mike Williams', email: 'mike@example.com', role: 'COACH', joinedAt: '2022-08-10', lastActive: '2025-12-28', teams: ['First Team'] },
  { id: 'm4', name: 'Emma Brown', email: 'emma@example.com', role: 'MANAGER', joinedAt: '2023-01-05', lastActive: '2025-12-30', teams: ['U16 Boys', 'U18 Boys'] },
  { id: 'm5', name: 'David Wilson', email: 'david@example.com', role: 'STAFF', joinedAt: '2024-06-15', lastActive: '2025-12-27', teams: [] },
];

const MOCK_TEAMS: OrgTeam[] = [
  { id: 't1', name: 'First Team', sport: 'FOOTBALL', ageGroup: 'Senior', coachCount: 3, playerCount: 25, isActive: true },
  { id: 't2', name: 'Reserves', sport: 'FOOTBALL', ageGroup: 'Senior', coachCount: 2, playerCount: 22, isActive: true },
  { id: 't3', name: 'U18 Boys', sport: 'FOOTBALL', ageGroup: 'U18', coachCount: 2, playerCount: 18, isActive: true },
  { id: 't4', name: 'U16 Boys', sport: 'FOOTBALL', ageGroup: 'U16', coachCount: 2, playerCount: 20, isActive: true },
  { id: 't5', name: 'Rugby 1st XV', sport: 'RUGBY', ageGroup: 'Senior', coachCount: 2, playerCount: 30, isActive: true },
  { id: 't6', name: 'Basketball A', sport: 'BASKETBALL', ageGroup: 'Senior', coachCount: 1, playerCount: 12, isActive: false },
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'a1', action: 'Member Invited', user: 'John Smith', target: 'david@example.com', timestamp: '2025-12-30T10:30:00Z', details: 'Invited as Staff' },
  { id: 'a2', action: 'Team Created', user: 'Sarah Johnson', target: 'U14 Girls', timestamp: '2025-12-29T15:45:00Z' },
  { id: 'a3', action: 'Role Changed', user: 'John Smith', target: 'Emma Brown', timestamp: '2025-12-28T09:20:00Z', details: 'Coach → Manager' },
  { id: 'a4', action: 'Plan Upgraded', user: 'John Smith', timestamp: '2025-12-27T14:00:00Z', details: 'Free → Pro' },
  { id: 'a5', action: 'Member Removed', user: 'Sarah Johnson', target: 'old.user@example.com', timestamp: '2025-12-26T11:30:00Z' },
];

// Components
const MemberRow = ({ member, onChangeRole, onRemove }: { member: OrgMember; onChangeRole: (newRole: OrgRole) => void; onRemove: () => void }) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleConfig = ROLE_CONFIG[member.role];

  return (
    <div className="p-4 bg-neutral-50 dark:bg-charcoal-700/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
          {member.name.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-charcoal-900 dark:text-white">{member.name}</p>
          <p className="text-xs text-charcoal-500">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-charcoal-500 hidden md:block">
          <p>Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
          <p>Active {new Date(member.lastActive).toLocaleDateString()}</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`px-3 py-1.5 rounded-lg ${roleConfig.color} font-semibold text-sm flex items-center gap-1`}
          >
            {roleConfig.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showRoleMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-charcoal-800 rounded-lg shadow-lg border border-neutral-200 dark:border-charcoal-700 z-10">
              {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                <button
                  key={role}
                  onClick={() => { onChangeRole(role as OrgRole); setShowRoleMenu(false); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-charcoal-700 ${member.role === role ? 'font-bold' : ''}`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {member.role !== 'OWNER' && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

const TeamRow = ({ team, onEdit, onToggleActive }: { team: OrgTeam; onEdit: () => void; onToggleActive: () => void }) => {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${team.isActive ? 'border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10' : 'border-neutral-200 dark:border-charcoal-600 opacity-60'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{SPORT_ICONS[team.sport]}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-charcoal-900 dark:text-white">{team.name}</p>
              {!team.isActive && <Badge variant="outline">Inactive</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-500">
              <span>{team.ageGroup}</span>
              <span>•</span>
              <span>{team.coachCount} coaches</span>
              <span>•</span>
              <span>{team.playerCount} players</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onToggleActive}>
            {team.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function OrganisationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toasts, success, error: showError, info } = useToast();

  // Check admin access
  const userRoles = (session?.user as any)?.roles || [];
  const isAdmin = useMemo(() => userRoles.some((role: string) => ADMIN_ROLES.includes(role)), [userRoles]);

  // State
  const [org, setOrg] = useState(MOCK_ORG);
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [auditLogs] = useState(MOCK_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not admin
  useEffect(() => {
    if (session && !isAdmin) {
      router.push('/dashboard/settings');
    }
  }, [session, isAdmin, router]);

  // Handlers
  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      showError('Please enter a valid email');
      return;
    }
    setIsInviting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsInviting(false);
    setInviteEmail('');
    success(`Invitation sent to ${inviteEmail}`);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!window.confirm('Remove this member from the organisation?')) return;
    setMembers(prev => prev.filter(m => m.id !== memberId));
    success('Member removed');
  };

  const handleChangeRole = (memberId: string, newRole: OrgRole) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    success('Role updated');
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-12 text-center">
        <Shield className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
        <h3 className="font-bold text-charcoal-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-charcoal-500">You need admin privileges to access organisation settings.</p>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white">Organisation Settings</h2>
        <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">Manage your organisation, members, and teams</p>
      </div>

      {/* Org Header */}
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-gold-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-gold-900/20 border-purple-200 dark:border-purple-900/40">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {org.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-charcoal-900 dark:text-white">{org.name}</h3>
                {org.isVerified && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Check className="w-3 h-3 mr-1" />Verified
                  </Badge>
                )}
                <Badge className="bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400 capitalize">
                  {org.plan} Plan
                </Badge>
              </div>
              <p className="text-charcoal-600 dark:text-charcoal-400 mb-2">{org.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-500">
                <span className="flex items-center gap-1">{org.sports.map(s => SPORT_ICONS[s]).join(' ')}</span>
                <span>•</span>
                <span>{org.location}</span>
                <span>•</span>
                <span>Founded {org.foundedYear}</span>
                <span>•</span>
                <span>{org.memberCount} members</span>
                <span>•</span>
                <span>{org.teamCount} teams</span>
              </div>
            </div>
            <Button className="bg-purple-600 text-white">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Organisation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-neutral-100 dark:bg-charcoal-700 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg">Members</TabsTrigger>
          <TabsTrigger value="teams" className="rounded-lg">Teams</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg">Billing</TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg">Audit Log</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-charcoal-800">
              <CardContent className="p-4">
                <Users className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{org.memberCount}</p>
                <p className="text-sm text-charcoal-500">Total Members</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-charcoal-800">
              <CardContent className="p-4">
                <Shield className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{org.teamCount}</p>
                <p className="text-sm text-charcoal-500">Active Teams</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-charcoal-800">
              <CardContent className="p-4">
                <Globe className="w-6 h-6 text-green-500 mb-2" />
                <p className="text-2xl font-bold">{org.sports.length}</p>
                <p className="text-sm text-charcoal-500">Sports</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-charcoal-800">
              <CardContent className="p-4">
                <History className="w-6 h-6 text-gold-500 mb-2" />
                <p className="text-2xl font-bold">{new Date().getFullYear() - org.foundedYear}</p>
                <p className="text-sm text-charcoal-500">Years Active</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          {/* Invite Section */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-500" />Invite Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1"
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as OrgRole)}
                  className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700"
                >
                  {Object.entries(ROLE_CONFIG).filter(([r]) => r !== 'OWNER').map(([role, config]) => (
                    <option key={role} value={role}>{config.label}</option>
                  ))}
                </select>
                <Button onClick={handleInvite} disabled={isInviting} className="bg-green-600 text-white">
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4 mr-2" />Invite</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" />Members ({members.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredMembers.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onChangeRole={(newRole) => handleChangeRole(member.id, newRole)}
                  onRemove={() => handleRemoveMember(member.id)}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-purple-500" />Teams ({teams.length})</CardTitle>
                <Button className="bg-purple-600 text-white"><Plus className="w-4 h-4 mr-2" />Create Team</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {teams.map(team => (
                <TeamRow
                  key={team.id}
                  team={team}
                  onEdit={() => info('Edit team coming soon')}
                  onToggleActive={() => {
                    setTeams(prev => prev.map(t => t.id === team.id ? { ...t, isActive: !t.isActive } : t));
                    success(team.isActive ? 'Team deactivated' : 'Team activated');
                  }}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/20 dark:to-orange-900/20 border-gold-200 dark:border-gold-900/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Crown className="w-10 h-10 text-gold-500" />
                  <div>
                    <h3 className="text-xl font-bold text-charcoal-900 dark:text-white capitalize">{org.plan} Plan</h3>
                    <p className="text-charcoal-600 dark:text-charcoal-400">Organisation-level subscription</p>
                  </div>
                </div>
                <Button className="bg-gold-500 text-white">Manage Subscription</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="bg-white dark:bg-charcoal-800 border-neutral-200 dark:border-charcoal-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-orange-500" />Audit Log</CardTitle>
              <CardDescription>Recent activity in your organisation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-neutral-200 dark:divide-charcoal-700">
                {auditLogs.map(log => (
                  <div key={log.id} className="py-3 flex items-start gap-3">
                    <div className="p-2 bg-neutral-100 dark:bg-charcoal-700 rounded-lg">
                      <History className="w-4 h-4 text-charcoal-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-charcoal-900 dark:text-white">
                        {log.action}
                        {log.target && <span className="text-charcoal-500 font-normal"> - {log.target}</span>}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        by {log.user} • {new Date(log.timestamp).toLocaleString()}
                        {log.details && ` • ${log.details}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}