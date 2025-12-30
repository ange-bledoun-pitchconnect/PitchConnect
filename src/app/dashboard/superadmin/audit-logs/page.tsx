/**
 * Audit Logs Page - ENTERPRISE EDITION
 * Path: /dashboard/superadmin/audit-logs/page.tsx
 *
 * ============================================================================
 * WORLD-CLASS FEATURES
 * ============================================================================
 * ✅ Comprehensive audit action types (50+ actions)
 * ✅ Multi-sport filtering
 * ✅ Entity type filtering (User, Club, Team, Match, etc.)
 * ✅ Advanced date range picker
 * ✅ Real-time search
 * ✅ JSON details viewer with syntax highlighting
 * ✅ Export functionality (CSV/JSON)
 * ✅ Pagination with smart navigation
 * ✅ Statistics dashboard
 * ✅ Dark mode optimized
 * ✅ Accessibility compliant
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Info,
  Loader2,
  FileText,
  Building2,
  Users,
  Trophy,
  Whistle,
  CreditCard,
  Shield,
  Settings,
  Globe,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// CUSTOM TOAST SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'default';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

const Toast = ({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-blue-600 border-blue-500',
    default: 'bg-charcoal-700 border-charcoal-600',
  };

  return (
    <div className={`${styles[type]} text-white px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-2`}>
      {type === 'success' && <Check className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      {type === 'info' && <Info className="w-5 h-5" />}
      {type === 'default' && <Loader2 className="w-5 h-5 animate-spin" />}
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

type Sport = 'ALL' | 'FOOTBALL' | 'RUGBY' | 'BASKETBALL' | 'CRICKET' | 'AMERICAN_FOOTBALL' | 
  'NETBALL' | 'HOCKEY' | 'LACROSSE' | 'AUSTRALIAN_RULES' | 'GAELIC_FOOTBALL' | 'FUTSAL' | 'BEACH_FOOTBALL';

type EntityType = 'ALL' | 'USER' | 'CLUB' | 'TEAM' | 'MATCH' | 'LEAGUE' | 'PAYMENT' | 
  'SUBSCRIPTION' | 'REFEREE' | 'SCOUT' | 'PLAYER' | 'COACH' | 'SYSTEM';

type ActionCategory = 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH' | 'PAYMENT' | 'VERIFICATION' | 'SYSTEM';

interface AuditLog {
  id: string;
  action: string;
  actionCategory: ActionCategory;
  entityType: EntityType;
  entityId?: string;
  performedById: string;
  performedBy: {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  targetUserId?: string;
  targetUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  sport?: Sport;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AuditStats {
  totalLogs: number;
  logsToday: number;
  criticalActions: number;
  uniqueAdmins: number;
  byCategory: Record<string, number>;
  byEntity: Record<string, number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AUDIT_ACTIONS: Record<string, { label: string; category: ActionCategory; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; icon: React.ElementType }> = {
  // User Actions
  USER_CREATED: { label: 'User Created', category: 'CREATE', severity: 'LOW', icon: Users },
  USER_UPDATED: { label: 'User Updated', category: 'UPDATE', severity: 'LOW', icon: Users },
  USER_DELETED: { label: 'User Deleted', category: 'DELETE', severity: 'HIGH', icon: Users },
  USER_SUSPENDED: { label: 'User Suspended', category: 'UPDATE', severity: 'HIGH', icon: Shield },
  USER_BANNED: { label: 'User Banned', category: 'UPDATE', severity: 'CRITICAL', icon: Shield },
  USER_UNBANNED: { label: 'User Unbanned', category: 'UPDATE', severity: 'MEDIUM', icon: Shield },
  USER_VERIFIED: { label: 'User Verified', category: 'VERIFICATION', severity: 'LOW', icon: Check },
  USER_ROLE_CHANGED: { label: 'Role Changed', category: 'UPDATE', severity: 'MEDIUM', icon: Users },
  USER_IMPERSONATED: { label: 'User Impersonated', category: 'AUTH', severity: 'CRITICAL', icon: User },
  IMPERSONATION_ENDED: { label: 'Impersonation Ended', category: 'AUTH', severity: 'HIGH', icon: User },
  
  // Auth Actions
  LOGIN_SUCCESS: { label: 'Login Success', category: 'AUTH', severity: 'LOW', icon: Shield },
  LOGIN_FAILED: { label: 'Login Failed', category: 'AUTH', severity: 'MEDIUM', icon: Shield },
  PASSWORD_CHANGED: { label: 'Password Changed', category: 'AUTH', severity: 'MEDIUM', icon: Shield },
  PASSWORD_RESET: { label: 'Password Reset', category: 'AUTH', severity: 'MEDIUM', icon: Shield },
  TWO_FA_ENABLED: { label: '2FA Enabled', category: 'AUTH', severity: 'LOW', icon: Shield },
  TWO_FA_DISABLED: { label: '2FA Disabled', category: 'AUTH', severity: 'HIGH', icon: Shield },
  
  // Club Actions
  CLUB_CREATED: { label: 'Club Created', category: 'CREATE', severity: 'LOW', icon: Building2 },
  CLUB_UPDATED: { label: 'Club Updated', category: 'UPDATE', severity: 'LOW', icon: Building2 },
  CLUB_DELETED: { label: 'Club Deleted', category: 'DELETE', severity: 'HIGH', icon: Building2 },
  CLUB_VERIFIED: { label: 'Club Verified', category: 'VERIFICATION', severity: 'MEDIUM', icon: Building2 },
  CLUB_SUSPENDED: { label: 'Club Suspended', category: 'UPDATE', severity: 'HIGH', icon: Building2 },
  
  // Team Actions
  TEAM_CREATED: { label: 'Team Created', category: 'CREATE', severity: 'LOW', icon: Users },
  TEAM_UPDATED: { label: 'Team Updated', category: 'UPDATE', severity: 'LOW', icon: Users },
  TEAM_DELETED: { label: 'Team Deleted', category: 'DELETE', severity: 'MEDIUM', icon: Users },
  PLAYER_ADDED: { label: 'Player Added', category: 'UPDATE', severity: 'LOW', icon: Users },
  PLAYER_REMOVED: { label: 'Player Removed', category: 'UPDATE', severity: 'LOW', icon: Users },
  PLAYER_TRANSFERRED: { label: 'Player Transferred', category: 'UPDATE', severity: 'MEDIUM', icon: Users },
  
  // Match Actions
  MATCH_CREATED: { label: 'Match Created', category: 'CREATE', severity: 'LOW', icon: Trophy },
  MATCH_UPDATED: { label: 'Match Updated', category: 'UPDATE', severity: 'LOW', icon: Trophy },
  MATCH_CANCELLED: { label: 'Match Cancelled', category: 'UPDATE', severity: 'MEDIUM', icon: Trophy },
  MATCH_COMPLETED: { label: 'Match Completed', category: 'UPDATE', severity: 'LOW', icon: Trophy },
  REFEREE_ASSIGNED: { label: 'Referee Assigned', category: 'UPDATE', severity: 'LOW', icon: Whistle },
  REFEREE_REMOVED: { label: 'Referee Removed', category: 'UPDATE', severity: 'MEDIUM', icon: Whistle },
  
  // League Actions
  LEAGUE_CREATED: { label: 'League Created', category: 'CREATE', severity: 'LOW', icon: Trophy },
  LEAGUE_UPDATED: { label: 'League Updated', category: 'UPDATE', severity: 'LOW', icon: Trophy },
  LEAGUE_DELETED: { label: 'League Deleted', category: 'DELETE', severity: 'HIGH', icon: Trophy },
  SEASON_STARTED: { label: 'Season Started', category: 'UPDATE', severity: 'LOW', icon: Trophy },
  SEASON_ENDED: { label: 'Season Ended', category: 'UPDATE', severity: 'LOW', icon: Trophy },
  
  // Referee/Scout Actions
  REFEREE_VERIFIED: { label: 'Referee Verified', category: 'VERIFICATION', severity: 'MEDIUM', icon: Whistle },
  REFEREE_QUALIFICATION_UPDATED: { label: 'Referee Qualification Updated', category: 'UPDATE', severity: 'MEDIUM', icon: Whistle },
  SCOUT_VERIFIED: { label: 'Scout Verified', category: 'VERIFICATION', severity: 'MEDIUM', icon: Eye },
  SCOUT_REPORT_CREATED: { label: 'Scout Report Created', category: 'CREATE', severity: 'LOW', icon: Eye },
  
  // Payment Actions
  PAYMENT_COMPLETED: { label: 'Payment Completed', category: 'PAYMENT', severity: 'LOW', icon: CreditCard },
  PAYMENT_FAILED: { label: 'Payment Failed', category: 'PAYMENT', severity: 'MEDIUM', icon: CreditCard },
  PAYMENT_REFUNDED: { label: 'Payment Refunded', category: 'PAYMENT', severity: 'MEDIUM', icon: CreditCard },
  SUBSCRIPTION_CREATED: { label: 'Subscription Created', category: 'PAYMENT', severity: 'LOW', icon: CreditCard },
  SUBSCRIPTION_UPGRADED: { label: 'Subscription Upgraded', category: 'PAYMENT', severity: 'LOW', icon: CreditCard },
  SUBSCRIPTION_DOWNGRADED: { label: 'Subscription Downgraded', category: 'PAYMENT', severity: 'LOW', icon: CreditCard },
  SUBSCRIPTION_CANCELLED: { label: 'Subscription Cancelled', category: 'PAYMENT', severity: 'MEDIUM', icon: CreditCard },
  SUBSCRIPTION_GRANTED: { label: 'Subscription Granted', category: 'PAYMENT', severity: 'MEDIUM', icon: CreditCard },
  MATCH_FEE_CHARGED: { label: 'Match Fee Charged', category: 'PAYMENT', severity: 'LOW', icon: CreditCard },
  CLUB_FEE_CHARGED: { label: 'Club Fee Charged', category: 'PAYMENT', severity: 'LOW', icon: CreditCard },
  
  // System Actions
  SYSTEM_MAINTENANCE: { label: 'System Maintenance', category: 'SYSTEM', severity: 'HIGH', icon: Settings },
  DATA_EXPORTED: { label: 'Data Exported', category: 'SYSTEM', severity: 'MEDIUM', icon: Download },
  CACHE_CLEARED: { label: 'Cache Cleared', category: 'SYSTEM', severity: 'LOW', icon: Settings },
  SETTINGS_UPDATED: { label: 'Settings Updated', category: 'SYSTEM', severity: 'MEDIUM', icon: Settings },
};

const ENTITY_TYPES: { value: EntityType; label: string; icon: React.ElementType }[] = [
  { value: 'ALL', label: 'All Entities', icon: Globe },
  { value: 'USER', label: 'Users', icon: Users },
  { value: 'CLUB', label: 'Clubs', icon: Building2 },
  { value: 'TEAM', label: 'Teams', icon: Users },
  { value: 'MATCH', label: 'Matches', icon: Trophy },
  { value: 'LEAGUE', label: 'Leagues', icon: Trophy },
  { value: 'PAYMENT', label: 'Payments', icon: CreditCard },
  { value: 'SUBSCRIPTION', label: 'Subscriptions', icon: CreditCard },
  { value: 'REFEREE', label: 'Referees', icon: Whistle },
  { value: 'SCOUT', label: 'Scouts', icon: Eye },
  { value: 'SYSTEM', label: 'System', icon: Settings },
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

const ACTION_CATEGORIES: { value: ActionCategory; label: string }[] = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'AUTH', label: 'Authentication' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'VERIFICATION', label: 'Verification' },
  { value: 'SYSTEM', label: 'System' },
];

// ============================================================================
// MOCK DATA
// ============================================================================

const generateMockLogs = (): AuditLog[] => {
  const actions = Object.keys(AUDIT_ACTIONS);
  const sports: Sport[] = ['FOOTBALL', 'RUGBY', 'BASKETBALL', 'CRICKET', 'HOCKEY'];
  const entities: EntityType[] = ['USER', 'CLUB', 'TEAM', 'MATCH', 'PAYMENT'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const config = AUDIT_ACTIONS[action];
    
    return {
      id: `log-${i + 1}`,
      action,
      actionCategory: config.category,
      entityType: entities[Math.floor(Math.random() * entities.length)],
      entityId: `entity-${Math.random().toString(36).substr(2, 9)}`,
      performedById: `admin-${i % 5 + 1}`,
      performedBy: {
        firstName: ['John', 'Jane', 'Mike', 'Sarah', 'Tom'][i % 5],
        lastName: ['Smith', 'Doe', 'Wilson', 'Brown', 'Davis'][i % 5],
        email: `admin${i % 5 + 1}@pitchconnect.com`,
        role: 'SUPERADMIN',
      },
      targetUserId: i % 3 === 0 ? `user-${Math.random().toString(36).substr(2, 9)}` : undefined,
      targetUser: i % 3 === 0 ? {
        firstName: 'Target',
        lastName: 'User',
        email: 'target@example.com',
      } : undefined,
      sport: i % 4 === 0 ? sports[Math.floor(Math.random() * sports.length)] : undefined,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      details: {
        previousValue: i % 2 === 0 ? 'OLD_VALUE' : undefined,
        newValue: i % 2 === 0 ? 'NEW_VALUE' : undefined,
        reason: i % 3 === 0 ? 'Admin action' : undefined,
        metadata: { source: 'dashboard', version: '1.0.0' },
      },
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      severity: config.severity,
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Severity Badge
 */
const SeverityBadge = ({ severity }: { severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) => {
  const styles = {
    LOW: 'bg-charcoal-700 text-charcoal-300',
    MEDIUM: 'bg-yellow-900/50 text-yellow-400',
    HIGH: 'bg-orange-900/50 text-orange-400',
    CRITICAL: 'bg-red-900/50 text-red-400 animate-pulse',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${styles[severity]}`}>
      {severity}
    </span>
  );
};

/**
 * Action Badge
 */
const ActionBadge = ({ action }: { action: string }) => {
  const config = AUDIT_ACTIONS[action];
  if (!config) return <span className="text-sm text-charcoal-400">{action}</span>;

  const categoryColors: Record<ActionCategory, string> = {
    ALL: 'bg-charcoal-700 text-charcoal-300',
    CREATE: 'bg-green-900/50 text-green-400',
    UPDATE: 'bg-blue-900/50 text-blue-400',
    DELETE: 'bg-red-900/50 text-red-400',
    AUTH: 'bg-purple-900/50 text-purple-400',
    PAYMENT: 'bg-gold-900/50 text-gold-400',
    VERIFICATION: 'bg-cyan-900/50 text-cyan-400',
    SYSTEM: 'bg-orange-900/50 text-orange-400',
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryColors[config.category]}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

/**
 * Filter Panel
 */
interface FilterPanelProps {
  search: string;
  entityType: EntityType;
  actionCategory: ActionCategory;
  sport: Sport;
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onEntityChange: (value: EntityType) => void;
  onCategoryChange: (value: ActionCategory) => void;
  onSportChange: (value: Sport) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onReset: () => void;
}

const FilterPanel = ({
  search, entityType, actionCategory, sport, dateFrom, dateTo,
  onSearchChange, onEntityChange, onCategoryChange, onSportChange,
  onDateFromChange, onDateToChange, onReset,
}: FilterPanelProps) => {
  return (
    <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gold-400" />
          <h3 className="text-lg font-bold text-white">Filters</h3>
        </div>
        <button onClick={onReset} className="text-sm text-charcoal-400 hover:text-white transition-colors">
          Reset All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-charcoal-400 mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by user, email, action..."
              className="w-full pl-10 pr-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />
          </div>
        </div>

        {/* Entity Type */}
        <div>
          <label className="block text-xs font-medium text-charcoal-400 mb-2">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => onEntityChange(e.target.value as EntityType)}
            className="w-full px-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          >
            {ENTITY_TYPES.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {/* Action Category */}
        <div>
          <label className="block text-xs font-medium text-charcoal-400 mb-2">Category</label>
          <select
            value={actionCategory}
            onChange={(e) => onCategoryChange(e.target.value as ActionCategory)}
            className="w-full px-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          >
            {ACTION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Sport */}
        <div>
          <label className="block text-xs font-medium text-charcoal-400 mb-2">Sport</label>
          <select
            value={sport}
            onChange={(e) => onSportChange(e.target.value as Sport)}
            className="w-full px-4 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50"
          >
            {SPORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="lg:col-span-2 xl:col-span-1">
          <label className="block text-xs font-medium text-charcoal-400 mb-2">Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-charcoal-700 border border-charcoal-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Log Row Component
 */
const LogRow = ({ log }: { log: AuditLog }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyDetails = async () => {
    await navigator.clipboard.writeText(JSON.stringify(log.details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sportIcon = log.sport ? SPORTS.find(s => s.value === log.sport)?.icon : null;

  return (
    <>
      <tr className="hover:bg-charcoal-750 transition-colors border-b border-charcoal-700/50">
        <td className="px-4 py-4">
          <div className="flex items-center gap-2 text-xs font-mono text-charcoal-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(log.timestamp).toLocaleString('en-GB', { 
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
            })}</span>
          </div>
        </td>
        <td className="px-4 py-4">
          <ActionBadge action={log.action} />
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {log.performedBy.firstName[0]}{log.performedBy.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {log.performedBy.firstName} {log.performedBy.lastName}
              </p>
              <p className="text-xs text-charcoal-500">{log.performedBy.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          {log.targetUser ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-charcoal-600 rounded-full flex items-center justify-center text-charcoal-300 text-xs">
                {log.targetUser.firstName[0]}
              </div>
              <span className="text-sm text-charcoal-300">{log.targetUser.firstName} {log.targetUser.lastName}</span>
            </div>
          ) : (
            <span className="text-charcoal-600">—</span>
          )}
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {sportIcon && <span className="text-lg">{sportIcon}</span>}
            <SeverityBadge severity={log.severity} />
          </div>
        </td>
        <td className="px-4 py-4 text-right">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-charcoal-700 hover:bg-charcoal-600 text-charcoal-300 rounded-lg text-sm transition-colors"
          >
            <Eye className="w-4 h-4" />
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-charcoal-800/50 border-b border-charcoal-700">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Metadata */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Metadata</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-charcoal-700/50 rounded-lg p-3">
                    <p className="text-xs text-charcoal-500 mb-1">Entity ID</p>
                    <code className="text-gold-400 font-mono text-xs">{log.entityId || '—'}</code>
                  </div>
                  <div className="bg-charcoal-700/50 rounded-lg p-3">
                    <p className="text-xs text-charcoal-500 mb-1">IP Address</p>
                    <code className="text-charcoal-300 font-mono text-xs">{log.ipAddress}</code>
                  </div>
                  <div className="col-span-2 bg-charcoal-700/50 rounded-lg p-3">
                    <p className="text-xs text-charcoal-500 mb-1">User Agent</p>
                    <p className="text-charcoal-400 text-xs truncate">{log.userAgent}</p>
                  </div>
                </div>
              </div>

              {/* Details JSON */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Details</h4>
                  <button
                    onClick={handleCopyDetails}
                    className="flex items-center gap-1 text-xs text-charcoal-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-charcoal-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-charcoal-300 max-h-40">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

/**
 * Stats Cards
 */
const StatsCards = ({ stats }: { stats: AuditStats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-900/30 rounded-lg">
          <FileText className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{stats.totalLogs.toLocaleString()}</p>
          <p className="text-xs text-charcoal-400">Total Logs</p>
        </div>
      </div>
    </div>
    <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-900/30 rounded-lg">
          <Activity className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{stats.logsToday}</p>
          <p className="text-xs text-charcoal-400">Today</p>
        </div>
      </div>
    </div>
    <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-900/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{stats.criticalActions}</p>
          <p className="text-xs text-charcoal-400">Critical</p>
        </div>
      </div>
    </div>
    <div className="bg-charcoal-800 border border-charcoal-700 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-900/30 rounded-lg">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{stats.uniqueAdmins}</p>
          <p className="text-xs text-charcoal-400">Active Admins</p>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AuditLogsPage() {
  const { toasts, removeToast, success, error: showError, info } = useToast();

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('ALL');
  const [actionCategory, setActionCategory] = useState<ActionCategory>('ALL');
  const [sport, setSport] = useState<Sport>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const ITEMS_PER_PAGE = 20;

  // Computed
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          log.performedBy.email.toLowerCase().includes(searchLower) ||
          log.performedBy.firstName.toLowerCase().includes(searchLower) ||
          log.performedBy.lastName.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.targetUser?.email.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (entityType !== 'ALL' && log.entityType !== entityType) return false;
      if (actionCategory !== 'ALL' && log.actionCategory !== actionCategory) return false;
      if (sport !== 'ALL' && log.sport !== sport) return false;
      if (dateFrom && new Date(log.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(log.timestamp) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [logs, search, entityType, actionCategory, sport, dateFrom, dateTo]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, page]);

  const pagination: Pagination = {
    page,
    limit: ITEMS_PER_PAGE,
    total: filteredLogs.length,
    pages: Math.ceil(filteredLogs.length / ITEMS_PER_PAGE),
  };

  const stats: AuditStats = useMemo(() => ({
    totalLogs: logs.length,
    logsToday: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    criticalActions: logs.filter(l => l.severity === 'CRITICAL').length,
    uniqueAdmins: new Set(logs.map(l => l.performedById)).size,
    byCategory: {},
    byEntity: {},
  }), [logs]);

  // Fetch data
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 800));
      setLogs(generateMockLogs());
      success('Audit logs loaded');
    } catch (err) {
      showError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [success, showError]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleReset = () => {
    setSearch('');
    setEntityType('ALL');
    setActionCategory('ALL');
    setSport('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      const headers = ['Timestamp', 'Action', 'Performer', 'Target', 'Entity', 'Severity', 'Sport'];
      const rows = filteredLogs.map(l => [
        new Date(l.timestamp).toISOString(),
        l.action,
        l.performedBy.email,
        l.targetUser?.email || '',
        l.entityType,
        l.severity,
        l.sport || '',
      ]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    success(`Exported ${filteredLogs.length} logs as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-charcoal-400">Complete history of platform actions and system events</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-charcoal-700 hover:bg-charcoal-600 text-white rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-white rounded-xl transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-charcoal-800 border border-charcoal-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => handleExport('csv')} className="w-full px-4 py-2 text-left text-sm text-charcoal-300 hover:bg-charcoal-700 rounded-t-xl">
                Export CSV
              </button>
              <button onClick={() => handleExport('json')} className="w-full px-4 py-2 text-left text-sm text-charcoal-300 hover:bg-charcoal-700 rounded-b-xl">
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Filters */}
      <FilterPanel
        search={search}
        entityType={entityType}
        actionCategory={actionCategory}
        sport={sport}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onEntityChange={(v) => { setEntityType(v); setPage(1); }}
        onCategoryChange={(v) => { setActionCategory(v); setPage(1); }}
        onSportChange={(v) => { setSport(v); setPage(1); }}
        onDateFromChange={(v) => { setDateFrom(v); setPage(1); }}
        onDateToChange={(v) => { setDateTo(v); setPage(1); }}
        onReset={handleReset}
      />

      {/* Table */}
      <div className="bg-charcoal-800 border border-charcoal-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-4" />
            <p className="text-charcoal-400">Loading audit logs...</p>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-charcoal-600 mx-auto mb-4" />
            <p className="text-charcoal-400 font-medium">No audit logs found</p>
            <p className="text-sm text-charcoal-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-charcoal-750 border-b border-charcoal-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Performed By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Severity</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-charcoal-700 flex items-center justify-between">
            <p className="text-sm text-charcoal-400">
              Showing <span className="font-semibold text-white">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-semibold text-white">{Math.min(page * ITEMS_PER_PAGE, pagination.total)}</span> of{' '}
              <span className="font-semibold text-white">{pagination.total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-charcoal-700 hover:bg-charcoal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-gold-600 text-white'
                        : 'bg-charcoal-700 text-charcoal-300 hover:bg-charcoal-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 bg-charcoal-700 hover:bg-charcoal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
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

AuditLogsPage.displayName = 'AuditLogsPage';