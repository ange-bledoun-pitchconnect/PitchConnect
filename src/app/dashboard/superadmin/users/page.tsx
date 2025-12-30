/**
 * Users List Page - ENTERPRISE EDITION
 * Path: /dashboard/superadmin/users/page.tsx
 *
 * ============================================================================
 * WORLD-CLASS FEATURES
 * ============================================================================
 * ✅ All user roles displayed (PLAYER, COACH, REFEREE, SCOUT, etc.)
 * ✅ Primary sport(s) shown
 * ✅ Club/team affiliations
 * ✅ Verification status for referees/scouts
 * ✅ Multi-sport filtering (12 sports)
 * ✅ Role filtering
 * ✅ Advanced search
 * ✅ User actions (suspend, ban, verify)
 * ✅ Export functionality
 * ✅ Dark mode optimized
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Users,
  User,
  Shield,
  Whistle,
  Eye,
  Building2,
  Trophy,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Ban,
  UserX,
  CheckCircle,
  XCircle,
  Mail,
  ExternalLink,
  X,
  Check,
  AlertCircle,
  Loader2,
  Crown,
  Calendar,
  Globe,
} from 'lucide-react';

// ============================================================================
// TOAST SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'default';
interface ToastMessage { id: string; type: ToastType; message: string; }

const Toast = ({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const styles = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600', default: 'bg-charcoal-700' };
  return (
    <div className={`${styles[type]} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3`}>
      {type === 'success' && <Check className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-4 h-4" /></button>
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }: { toasts: ToastMessage[]; onRemove: (id: string) => void }) => (
  <div className="fixed bottom-4 right-4 z-50 space-y-2">
    {toasts.map((t) => <Toast key={t.id} {...t} onClose={() => onRemove(t.id)} />)}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((message: string, type: ToastType = 'default') => {
    setToasts((prev) => [...prev, { id: `${Date.now()}`, message, type }]);
  }, []);
  const removeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, removeToast, success: (m: string) => addToast(m, 'success'), error: (m: string) => addToast(m, 'error'), info: (m: string) => addToast(m, 'info') };
};

// ============================================================================
// TYPES
// ============================================================================

type UserRole = 'PLAYER' | 'COACH' | 'REFEREE' | 'SCOUT' | 'PARENT' | 
  'CLUB_OWNER' | 'CLUB_MANAGER' | 'LEAGUE_ADMIN' | 'TEAM_CAPTAIN' | 'TEAM_MANAGER';

type UserStatus = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING';

type Sport = 'ALL' | 'FOOTBALL' | 'RUGBY' | 'BASKETBALL' | 'CRICKET' | 
  'AMERICAN_FOOTBALL' | 'NETBALL' | 'HOCKEY' | 'LACROSSE' | 
  'AUSTRALIAN_RULES' | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface UserAffiliation {
  type: 'CLUB' | 'TEAM' | 'LEAGUE';
  id: string;
  name: string;
  role: string;
}

interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: UserRole[];
  primarySport?: Sport;
  sports: Sport[];
  status: UserStatus;
  affiliations: UserAffiliation[];
  verification: {
    referee?: VerificationStatus;
    scout?: VerificationStatus;
  };
  subscriptionTier?: string;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const USER_ROLES: { value: UserRole | 'ALL'; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'ALL' as any, label: 'All Roles', icon: Users, color: 'bg-charcoal-700 text-charcoal-300' },
  { value: 'PLAYER', label: 'Player', icon: User, color: 'bg-blue-900/50 text-blue-400' },
  { value: 'COACH', label: 'Coach', icon: Shield, color: 'bg-green-900/50 text-green-400' },
  { value: 'REFEREE', label: 'Referee', icon: Whistle, color: 'bg-yellow-900/50 text-yellow-400' },
  { value: 'SCOUT', label: 'Scout', icon: Eye, color: 'bg-purple-900/50 text-purple-400' },
  { value: 'PARENT', label: 'Parent', icon: Users, color: 'bg-pink-900/50 text-pink-400' },
  { value: 'CLUB_OWNER', label: 'Club Owner', icon: Building2, color: 'bg-orange-900/50 text-orange-400' },
  { value: 'CLUB_MANAGER', label: 'Club Manager', icon: Building2, color: 'bg-cyan-900/50 text-cyan-400' },
  { value: 'LEAGUE_ADMIN', label: 'League Admin', icon: Trophy, color: 'bg-red-900/50 text-red-400' },
  { value: 'TEAM_CAPTAIN', label: 'Team Captain', icon: Crown, color: 'bg-gold-900/50 text-gold-400' },
  { value: 'TEAM_MANAGER', label: 'Team Manager', icon: Users, color: 'bg-indigo-900/50 text-indigo-400' },
];

const USER_STATUSES: { value: UserStatus; label: string; color: string }[] = [
  { value: 'ALL', label: 'All Statuses', color: 'bg-charcoal-700 text-charcoal-300' },
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-900/50 text-green-400' },
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-900/50 text-yellow-400' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'bg-orange-900/50 text-orange-400' },
  { value: 'BANNED', label: 'Banned', color: 'bg-red-900/50 text-red-400' },
];

const SPORTS: { value: Sport; label: string; icon: string }[] = [
  { value: 'ALL', label: 'All Sports', icon: '🌐' },
  { value: 'FOOTBALL', label: 'Football', icon: '⚽' },
  { value: 'RUGBY', label: 'Rugby', icon: '🏉' },
  { value: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { value: 'CRICKET', label: 'Cricket', icon: '🏏' },
  { value: 'AMERICAN_FOOTBALL', label: 'American Football', icon: '🏈' },
  { value: 'NETBALL', label: 'Netball', icon: '🏐' },
  { value: 'HOCKEY', label: 'Hockey', icon: '🏑' },
  { value: 'LACROSSE', label: 'Lacrosse', icon: '🥍' },
  { value: 'AUSTRALIAN_RULES', label: 'Australian Rules', icon: '🏉' },
  { value: 'GAELIC_FOOTBALL', label: 'Gaelic Football', icon: '⚽' },
  { value: 'FUTSAL', label: 'Futsal', icon: '⚽' },
  { value: 'BEACH_FOOTBALL', label: 'Beach Football', icon: '🏖️' },
];

const VERIFICATION_STATUSES: Record<VerificationStatus, { label: string; color: string; icon: React.ElementType }> = {
  UNVERIFIED: { label: 'Unverified', color: 'text-charcoal-500', icon: XCircle },
  PENDING: { label: 'Pending', color: 'text-yellow-400', icon: AlertCircle },
  VERIFIED: { label: 'Verified', color: 'text-green-400', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-400', icon: XCircle },
};

// ============================================================================
// MOCK DATA
// ============================================================================

const generateMockUsers = (): PlatformUser[] => {
  const roles: UserRole[] = ['PLAYER', 'COACH', 'REFEREE', 'SCOUT', 'PARENT', 'CLUB_OWNER', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];
  const sports: Sport[] = ['FOOTBALL', 'RUGBY', 'BASKETBALL', 'CRICKET', 'HOCKEY', 'NETBALL'];
  const statuses: UserStatus[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED'];
  const verificationStatuses: VerificationStatus[] = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'];
  const tiers = ['FREE', 'PLAYER_PRO', 'COACH', 'REFEREE', 'SCOUT', 'CLUB_MANAGER'];
  
  const firstNames = ['John', 'Sarah', 'Mike', 'Emma', 'James', 'Lisa', 'Tom', 'Anna', 'David', 'Sophie'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson', 'Taylor', 'Moore', 'Anderson', 'Thomas'];

  return Array.from({ length: 200 }, (_, i) => {
    const userRoles = [roles[Math.floor(Math.random() * roles.length)]];
    if (Math.random() > 0.7) userRoles.push(roles[Math.floor(Math.random() * roles.length)]);
    
    const userSports: Sport[] = [sports[Math.floor(Math.random() * sports.length)]];
    if (Math.random() > 0.6) userSports.push(sports[Math.floor(Math.random() * sports.length)]);
    
    const hasReferee = userRoles.includes('REFEREE');
    const hasScout = userRoles.includes('SCOUT');
    
    const affiliations: UserAffiliation[] = [];
    if (Math.random() > 0.3) {
      affiliations.push({
        type: 'CLUB',
        id: `club-${i}`,
        name: ['Manchester Elite FC', 'London Rugby Club', 'Bristol Ballers', 'Yorkshire CC'][Math.floor(Math.random() * 4)],
        role: userRoles[0],
      });
    }
    if (Math.random() > 0.5) {
      affiliations.push({
        type: 'TEAM',
        id: `team-${i}`,
        name: ['First Team', 'U18s', 'Reserves', 'Academy'][Math.floor(Math.random() * 4)],
        role: userRoles[0],
      });
    }

    return {
      id: `user-${i + 1}`,
      email: `${firstNames[i % 10].toLowerCase()}.${lastNames[i % 10].toLowerCase()}${i}@example.com`,
      firstName: firstNames[i % 10],
      lastName: lastNames[i % 10],
      avatar: undefined,
      roles: userRoles,
      primarySport: userSports[0],
      sports: userSports,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      affiliations,
      verification: {
        referee: hasReferee ? verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)] : undefined,
        scout: hasScout ? verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)] : undefined,
      },
      subscriptionTier: tiers[Math.floor(Math.random() * tiers.length)],
      emailVerified: Math.random() > 0.1,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActiveAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Role Badge
 */
const RoleBadge = ({ role }: { role: UserRole }) => {
  const config = USER_ROLES.find(r => r.value === role);
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

/**
 * Status Badge
 */
const StatusBadge = ({ status }: { status: UserStatus }) => {
  const config = USER_STATUSES.find(s => s.value === status);
  if (!config) return null;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
};

/**
 * Verification Badge
 */
const VerificationBadge = ({ status, type }: { status: VerificationStatus; type: 'referee' | 'scout' }) => {
  const config = VERIFICATION_STATUSES[status];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1 text-xs ${config.color}`}>
      <Icon className="w-3 h-3" />
      <span>{type === 'referee' ? 'Ref' : 'Scout'}: {config.label}</span>
    </div>
  );
};

/**
 * User Row
 */
const UserRow = ({ 
  user, 
  onAction 
}: { 
  user: PlatformUser; 
  onAction: (action: string, user: PlatformUser) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const sportIcons = user.sports.map(s => SPORTS.find(sp => sp.value === s)?.icon).filter(Boolean);

  return (
    <tr className="hover:bg-charcoal-750 transition-colors border-b border-charcoal-700/50">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium truncate">{user.firstName} {user.lastName}</p>
              {!user.emailVerified && (
                <span className="text-xs text-yellow-400">(unverified)</span>
              )}
            </div>
            <p className="text-charcoal-500 text-xs truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1">
          {user.roles.slice(0, 2).map(role => (
            <RoleBadge key={role} role={role} />
          ))}
          {user.roles.length > 2 && (
            <span className="px-2 py-0.5 bg-charcoal-700 text-charcoal-400 rounded text-xs">
              +{user.roles.length - 2}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1">
          {sportIcons.map((icon, i) => (
            <span key={i} className="text-lg">{icon}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          {user.affiliations.slice(0, 2).map((aff, i) => (
            <div key={i} className="text-xs">
              <span className="text-charcoal-500">{aff.type}:</span>{' '}
              <span className="text-charcoal-300">{aff.name}</span>
            </div>
          ))}
          {user.affiliations.length === 0 && (
            <span className="text-charcoal-600 text-xs">No affiliations</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          {user.verification.referee && (
            <VerificationBadge status={user.verification.referee} type="referee" />
          )}
          {user.verification.scout && (
            <VerificationBadge status={user.verification.scout} type="scout" />
          )}
          {!user.verification.referee && !user.verification.scout && (
            <span className="text-charcoal-600 text-xs">N/A</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-4">
        <div className="relative">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/superadmin/users/${user.id}`}
              className="px-3 py-1.5 bg-gold-600 hover:bg-gold-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              View
            </Link>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 bg-charcoal-700 hover:bg-charcoal-600 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-charcoal-400" />
            </button>
          </div>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-charcoal-800 border border-charcoal-700 rounded-xl shadow-xl z-20 overflow-hidden">
                {user.status === 'ACTIVE' && (
                  <button
                    onClick={() => { onAction('suspend', user); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-orange-400 hover:bg-charcoal-700"
                  >
                    <UserX className="w-4 h-4" />
                    Suspend User
                  </button>
                )}
                {user.status === 'SUSPENDED' && (
                  <button
                    onClick={() => { onAction('unsuspend', user); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-green-400 hover:bg-charcoal-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Unsuspend User
                  </button>
                )}
                {user.status !== 'BANNED' && (
                  <button
                    onClick={() => { onAction('ban', user); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-charcoal-700"
                  >
                    <Ban className="w-4 h-4" />
                    Ban User
                  </button>
                )}
                {(user.verification.referee === 'PENDING' || user.verification.scout === 'PENDING') && (
                  <button
                    onClick={() => { onAction('verify', user); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-green-400 hover:bg-charcoal-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify User
                  </button>
                )}
                <button
                  onClick={() => { onAction('email', user); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-charcoal-300 hover:bg-charcoal-700"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

/**
 * Stats Bar
 */
const StatsBar = ({ users }: { users: PlatformUser[] }) => {
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    pending: users.filter(u => u.status === 'PENDING').length,
    suspended: users.filter(u => u.status === 'SUSPENDED').length,
    pendingVerification: users.filter(u => 
      u.verification.referee === 'PENDING' || u.verification.scout === 'PENDING'
    ).length,
  }), [users]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/30 rounded-lg">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
            <p className="text-xs text-charcoal-400">Total Users</p>
          </div>
        </div>
      </div>
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-900/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.active.toLocaleString()}</p>
            <p className="text-xs text-charcoal-400">Active</p>
          </div>
        </div>
      </div>
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-900/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
            <p className="text-xs text-charcoal-400">Pending</p>
          </div>
        </div>
      </div>
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-900/30 rounded-lg">
            <UserX className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.suspended}</p>
            <p className="text-xs text-charcoal-400">Suspended</p>
          </div>
        </div>
      </div>
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-900/30 rounded-lg">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.pendingVerification}</p>
            <p className="text-xs text-charcoal-400">Pending Verification</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UsersPage() {
  const { toasts, removeToast, success, error: showError } = useToast();

  // State
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | 'ALL'>('ALL');
  const [status, setStatus] = useState<UserStatus>('ALL');
  const [sport, setSport] = useState<Sport>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');

  const ITEMS_PER_PAGE = 25;

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(generateMockUsers());
    } catch (err) {
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matches = 
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.id.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      if (role !== 'ALL' && !user.roles.includes(role)) return false;
      if (status !== 'ALL' && user.status !== status) return false;
      if (sport !== 'ALL' && !user.sports.includes(sport)) return false;
      if (verificationFilter === 'PENDING') {
        if (user.verification.referee !== 'PENDING' && user.verification.scout !== 'PENDING') return false;
      }
      if (verificationFilter === 'VERIFIED') {
        if (user.verification.referee !== 'VERIFIED' && user.verification.scout !== 'VERIFIED') return false;
      }
      return true;
    });
  }, [users, search, role, status, sport, verificationFilter]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  // Handle action
  const handleAction = (action: string, user: PlatformUser) => {
    switch (action) {
      case 'suspend':
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'SUSPENDED' as UserStatus } : u));
        success(`Suspended ${user.firstName} ${user.lastName}`);
        break;
      case 'unsuspend':
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'ACTIVE' as UserStatus } : u));
        success(`Unsuspended ${user.firstName} ${user.lastName}`);
        break;
      case 'ban':
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'BANNED' as UserStatus } : u));
        success(`Banned ${user.firstName} ${user.lastName}`);
        break;
      case 'verify':
        setUsers(prev => prev.map(u => u.id === user.id ? { 
          ...u, 
          verification: { 
            referee: u.verification.referee === 'PENDING' ? 'VERIFIED' as VerificationStatus : u.verification.referee,
            scout: u.verification.scout === 'PENDING' ? 'VERIFIED' as VerificationStatus : u.verification.scout,
          }
        } : u));
        success(`Verified ${user.firstName} ${user.lastName}`);
        break;
      case 'email':
        success(`Email dialog would open for ${user.email}`);
        break;
    }
  };

  // Export
  const handleExport = () => {
    const headers = ['ID', 'Name', 'Email', 'Roles', 'Sports', 'Status', 'Affiliations', 'Created'];
    const rows = filteredUsers.map(u => [
      u.id,
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.roles.join(';'),
      u.sports.join(';'),
      u.status,
      u.affiliations.map(a => a.name).join(';'),
      new Date(u.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    success('Users exported');
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-charcoal-400">Comprehensive user administration • {filteredUsers.length} users</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-charcoal-700 hover:bg-charcoal-600 text-white rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-gold-600 hover:bg-gold-500 text-white font-medium rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar users={users} />

      {/* Filters */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gold-400" />
          <h3 className="text-lg font-bold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-charcoal-400 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, email, ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-400 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value as UserRole | 'ALL'); setPage(1); }}
              className="w-full px-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            >
              {USER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-400 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as UserStatus); setPage(1); }}
              className="w-full px-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            >
              {USER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-400 mb-2">Sport</label>
            <select
              value={sport}
              onChange={(e) => { setSport(e.target.value as Sport); setPage(1); }}
              className="w-full px-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            >
              {SPORTS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-400 mb-2">Verification</label>
            <select
              value={verificationFilter}
              onChange={(e) => { setVerificationFilter(e.target.value as any); setPage(1); }}
              className="w-full px-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending Verification</option>
              <option value="VERIFIED">Verified Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-4" />
            <p className="text-charcoal-400">Loading users...</p>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-charcoal-600 mx-auto mb-4" />
            <p className="text-charcoal-400 font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-charcoal-750 border-b border-charcoal-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase">Roles</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase">Sports</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase">Affiliations</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase">Verification</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => (
                  <UserRow key={user.id} user={user} onAction={handleAction} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-charcoal-700 flex items-center justify-between">
            <p className="text-sm text-charcoal-400">
              Page <span className="font-semibold text-white">{page}</span> of{' '}
              <span className="font-semibold text-white">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-charcoal-700 hover:bg-charcoal-600 disabled:opacity-50 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-charcoal-700 hover:bg-charcoal-600 disabled:opacity-50 rounded-lg"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

UsersPage.displayName = 'UsersPage';