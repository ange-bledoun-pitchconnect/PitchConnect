/**
 * ============================================================================
 * AdminHeader Component
 * ============================================================================
 * 
 * Enterprise-grade admin header with notifications, settings, and profile menu.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * 
 * AFFECTED USER ROLES:
 * - SUPERADMIN: Full access to all admin features
 * - ADMIN: Organization-level admin access
 * - CLUB_MANAGER: Club management features
 * - CLUB_OWNER: Club ownership features
 * - LEAGUE_ADMIN: League administration
 * 
 * SCHEMA ALIGNMENT:
 * - User model (roles, status, avatar)
 * - Notification model (type, priority, isRead)
 * - NotificationType enum (100+ types)
 * - Organisation model (for context)
 * - Sport enum (for sport context display)
 * 
 * FEATURES:
 * - Role-based menu rendering
 * - Real-time notification updates
 * - Sport context indicator
 * - Keyboard accessibility (ESC to close)
 * - Click-outside to close dropdowns
 * - Organisation switcher (for multi-org users)
 * - Responsive design
 * 
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Settings,
  LogOut,
  User,
  RefreshCw,
  ChevronDown,
  Shield,
  Building2,
  Users,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Loader2,
  Search,
  Moon,
  Sun,
  HelpCircle,
  Keyboard,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

// =============================================================================
// TYPE DEFINITIONS (Aligned with Schema v7.10.1)
// =============================================================================

/**
 * User roles from schema - determines menu visibility
 */
type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'PLAYER'
  | 'COACH'
  | 'MANAGER'
  | 'CLUB_MANAGER'
  | 'CLUB_OWNER'
  | 'TREASURER'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST'
  | 'PARENT'
  | 'LEAGUE_ADMIN'
  | 'MEDICAL_STAFF'
  | 'MEDIA_MANAGER';

/**
 * Notification priority levels
 */
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Notification categories for grouping (subset of NotificationType)
 */
type NotificationCategory =
  | 'SYSTEM'
  | 'MATCH'
  | 'TRAINING'
  | 'PLAYER'
  | 'FINANCIAL'
  | 'TEAM'
  | 'ACHIEVEMENT'
  | 'VIDEO'
  | 'OTHER';

/**
 * Sport types from schema
 */
type Sport =
  | 'FOOTBALL'
  | 'NETBALL'
  | 'RUGBY'
  | 'CRICKET'
  | 'AMERICAN_FOOTBALL'
  | 'BASKETBALL'
  | 'HOCKEY'
  | 'LACROSSE'
  | 'AUSTRALIAN_RULES'
  | 'GAELIC_FOOTBALL'
  | 'FUTSAL'
  | 'BEACH_FOOTBALL';

/**
 * Notification interface aligned with schema
 */
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  isRead: boolean;
  readAt: string | null;
  link: string | null;
  data: Record<string, unknown> | null;
  expiresAt: string | null;
  createdAt: string;
}

/**
 * Organisation context for multi-org users
 */
interface OrganisationContext {
  id: string;
  name: string;
  logo: string | null;
  role: string;
  sport: Sport;
}

/**
 * Extended session user with schema fields
 */
interface ExtendedUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: UserRole[];
  isSuperAdmin: boolean;
  primaryOrganisationId: string | null;
  organisations: OrganisationContext[];
  sport?: Sport;
}

/**
 * Component props
 */
interface AdminHeaderProps {
  /** Custom class name */
  className?: string;
  /** Show organisation switcher */
  showOrgSwitcher?: boolean;
  /** Callback when organisation changes */
  onOrganisationChange?: (orgId: string) => void;
}

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

/**
 * Sport display configuration
 */
const SPORT_CONFIG: Record<Sport, { icon: string; label: string; color: string }> = {
  FOOTBALL: { icon: '⚽', label: 'Football', color: 'bg-green-500' },
  NETBALL: { icon: '🏐', label: 'Netball', color: 'bg-purple-500' },
  RUGBY: { icon: '🏉', label: 'Rugby', color: 'bg-red-500' },
  CRICKET: { icon: '🏏', label: 'Cricket', color: 'bg-amber-500' },
  AMERICAN_FOOTBALL: { icon: '🏈', label: 'American Football', color: 'bg-brown-500' },
  BASKETBALL: { icon: '🏀', label: 'Basketball', color: 'bg-orange-500' },
  HOCKEY: { icon: '🏒', label: 'Hockey', color: 'bg-blue-500' },
  LACROSSE: { icon: '🥍', label: 'Lacrosse', color: 'bg-indigo-500' },
  AUSTRALIAN_RULES: { icon: '🏉', label: 'AFL', color: 'bg-yellow-500' },
  GAELIC_FOOTBALL: { icon: '🏐', label: 'Gaelic Football', color: 'bg-emerald-500' },
  FUTSAL: { icon: '⚽', label: 'Futsal', color: 'bg-teal-500' },
  BEACH_FOOTBALL: { icon: '⚽', label: 'Beach Football', color: 'bg-cyan-500' },
};

/**
 * Role badge configuration
 */
const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  SUPERADMIN: { label: 'Super Admin', className: 'bg-pink-900 text-pink-200' },
  ADMIN: { label: 'Admin', className: 'bg-purple-900 text-purple-200' },
  CLUB_MANAGER: { label: 'Club Manager', className: 'bg-blue-900 text-blue-200' },
  CLUB_OWNER: { label: 'Club Owner', className: 'bg-gold-900 text-gold-200' },
  LEAGUE_ADMIN: { label: 'League Admin', className: 'bg-indigo-900 text-indigo-200' },
  MANAGER: { label: 'Manager', className: 'bg-green-900 text-green-200' },
  COACH: { label: 'Coach', className: 'bg-teal-900 text-teal-200' },
  ANALYST: { label: 'Analyst', className: 'bg-cyan-900 text-cyan-200' },
};

/**
 * Notification category icons
 */
const NOTIFICATION_ICONS: Record<NotificationCategory, React.ReactNode> = {
  SYSTEM: <Settings className="w-4 h-4" />,
  MATCH: <Activity className="w-4 h-4" />,
  TRAINING: <Calendar className="w-4 h-4" />,
  PLAYER: <User className="w-4 h-4" />,
  FINANCIAL: <Building2 className="w-4 h-4" />,
  TEAM: <Users className="w-4 h-4" />,
  ACHIEVEMENT: <CheckCircle className="w-4 h-4" />,
  VIDEO: <Activity className="w-4 h-4" />,
  OTHER: <Info className="w-4 h-4" />,
};

/**
 * Priority color configuration
 */
const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  LOW: 'bg-charcoal-600',
  NORMAL: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the highest priority role for display
 */
function getPrimaryRole(roles: UserRole[]): UserRole {
  const priorityOrder: UserRole[] = [
    'SUPERADMIN',
    'ADMIN',
    'CLUB_OWNER',
    'CLUB_MANAGER',
    'LEAGUE_ADMIN',
    'MANAGER',
    'COACH',
    'ANALYST',
  ];

  for (const role of priorityOrder) {
    if (roles.includes(role)) {
      return role;
    }
  }

  return roles[0] || 'ADMIN';
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Categorize notification type
 */
function categorizeNotification(type: string): NotificationCategory {
  if (type.startsWith('SYSTEM') || type.startsWith('ACCOUNT')) return 'SYSTEM';
  if (type.startsWith('MATCH')) return 'MATCH';
  if (type.startsWith('TRAINING')) return 'TRAINING';
  if (type.startsWith('PLAYER')) return 'PLAYER';
  if (type.startsWith('PAYMENT') || type.startsWith('SUBSCRIPTION')) return 'FINANCIAL';
  if (type.startsWith('TEAM')) return 'TEAM';
  if (type.startsWith('ACHIEVEMENT') || type.startsWith('BADGE') || type.startsWith('XP')) return 'ACHIEVEMENT';
  if (type.startsWith('VIDEO')) return 'VIDEO';
  return 'OTHER';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AdminHeader({
  className = '',
  showOrgSwitcher = true,
  onOrganisationChange,
}: AdminHeaderProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<OrganisationContext | null>(null);
  const [notificationFilter, setNotificationFilter] = useState<NotificationCategory | 'ALL'>('ALL');

  // Refs for click-outside handling
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  // Cast session user to extended type
  const user = session?.user as ExtendedUser | undefined;

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  // Fetch notifications on mount
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  // Set initial organisation
  useEffect(() => {
    if (user?.organisations?.length && !selectedOrg) {
      const primaryOrg = user.organisations.find(
        (org) => org.id === user.primaryOrganisationId
      ) || user.organisations[0];
      setSelectedOrg(primaryOrg);
    }
  }, [user?.organisations, user?.primaryOrganisationId, selectedOrg]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowOrgDropdown(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target as Node)) {
        setShowOrgDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user?.id) return;

    const pollInterval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(pollInterval);
  }, [user?.id]);

  // ---------------------------------------------------------------------------
  // API FUNCTIONS
  // ---------------------------------------------------------------------------

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingNotifications(true);
    setNotificationError(null);

    try {
      const response = await fetch('/api/notifications?limit=20&unreadOnly=false', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      const notifs = (data.notifications || []).map((n: Notification) => ({
        ...n,
        category: categorizeNotification(n.type),
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotificationError('Failed to load notifications');
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleOrganisationChange = (org: OrganisationContext) => {
    setSelectedOrg(org);
    setShowOrgDropdown(false);
    onOrganisationChange?.(org.id);
  };

  // ---------------------------------------------------------------------------
  // COMPUTED VALUES
  // ---------------------------------------------------------------------------

  const primaryRole = user?.roles ? getPrimaryRole(user.roles) : 'ADMIN';
  const roleConfig = ROLE_CONFIG[primaryRole] || ROLE_CONFIG.ADMIN;
  const currentSport = selectedOrg?.sport || user?.sport || 'FOOTBALL';
  const sportConfig = SPORT_CONFIG[currentSport];

  const filteredNotifications = notifications.filter(
    (n) => notificationFilter === 'ALL' || n.category === notificationFilter
  );

  const isAdmin = user?.isSuperAdmin || 
    user?.roles?.some((r) => ['SUPERADMIN', 'ADMIN', 'CLUB_MANAGER', 'CLUB_OWNER'].includes(r));

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (status === 'loading') {
    return (
      <div className={`flex items-center justify-end gap-4 px-6 py-4 bg-charcoal-800 border-b border-charcoal-700 ${className}`}>
        <Loader2 className="w-5 h-5 text-charcoal-400 animate-spin" />
      </div>
    );
  }

  return (
    <header
      className={`flex items-center justify-between gap-4 px-6 py-4 bg-charcoal-800 border-b border-charcoal-700 ${className}`}
      role="banner"
    >
      {/* Left Section - Sport Context & Organisation */}
      <div className="flex items-center gap-4">
        {/* Sport Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-charcoal-700/50 rounded-lg">
          <span className="text-lg" role="img" aria-label={sportConfig.label}>
            {sportConfig.icon}
          </span>
          <span className="text-sm font-medium text-charcoal-300 hidden sm:inline">
            {sportConfig.label}
          </span>
        </div>

        {/* Organisation Switcher */}
        {showOrgSwitcher && user?.organisations && user.organisations.length > 1 && (
          <div className="relative" ref={orgDropdownRef}>
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-charcoal-700/50 hover:bg-charcoal-700 rounded-lg transition-colors"
              aria-haspopup="listbox"
              aria-expanded={showOrgDropdown}
            >
              <Building2 className="w-4 h-4 text-charcoal-400" />
              <span className="text-sm font-medium text-white max-w-[150px] truncate">
                {selectedOrg?.name || 'Select Organisation'}
              </span>
              <ChevronDown className={`w-4 h-4 text-charcoal-400 transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showOrgDropdown && (
              <div
                className="absolute left-0 mt-2 w-64 bg-charcoal-800 rounded-lg shadow-xl border border-charcoal-700 py-2 z-50"
                role="listbox"
              >
                {user.organisations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrganisationChange(org)}
                    className={`w-full text-left px-4 py-2 hover:bg-charcoal-700 transition-colors flex items-center gap-3 ${
                      selectedOrg?.id === org.id ? 'bg-charcoal-700' : ''
                    }`}
                    role="option"
                    aria-selected={selectedOrg?.id === org.id}
                  >
                    {org.logo ? (
                      <img src={org.logo} alt="" className="w-6 h-6 rounded" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-charcoal-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-charcoal-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{org.name}</p>
                      <p className="text-xs text-charcoal-400">{org.role}</p>
                    </div>
                    <span className="text-sm">{SPORT_CONFIG[org.sport]?.icon}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Search (Keyboard Shortcut: Ctrl+K) */}
        <button
          className="p-2 text-charcoal-400 hover:text-gold-400 hover:bg-charcoal-700 rounded-lg transition-all hidden md:flex items-center gap-2"
          title="Search (Ctrl+K)"
        >
          <Search className="w-5 h-5" />
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-charcoal-700 rounded border border-charcoal-600">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-charcoal-400 hover:text-gold-400 hover:bg-charcoal-700 rounded-lg transition-all"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Help */}
        <Link
          href="/dashboard/help"
          className="p-2 text-charcoal-400 hover:text-gold-400 hover:bg-charcoal-700 rounded-lg transition-all hidden md:block"
          title="Help & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-charcoal-400 hover:text-gold-400 hover:bg-charcoal-700 rounded-lg transition-all"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-haspopup="true"
            aria-expanded={showNotifications}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-96 bg-charcoal-800 rounded-lg shadow-xl border border-charcoal-700 z-50 max-h-[70vh] flex flex-col"
              role="dialog"
              aria-label="Notifications"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-charcoal-700 flex items-center justify-between flex-shrink-0">
                <h3 className="text-white font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-gold-400 hover:text-gold-300"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={fetchNotifications}
                    className="p-1 text-charcoal-400 hover:text-gold-400 rounded transition-colors"
                    disabled={isLoadingNotifications}
                    aria-label="Refresh notifications"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="px-4 py-2 border-b border-charcoal-700 flex-shrink-0 overflow-x-auto">
                <div className="flex gap-1">
                  {(['ALL', 'SYSTEM', 'MATCH', 'TRAINING', 'ACHIEVEMENT', 'VIDEO'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNotificationFilter(cat)}
                      className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                        notificationFilter === cat
                          ? 'bg-gold-500 text-charcoal-900'
                          : 'bg-charcoal-700 text-charcoal-300 hover:bg-charcoal-600'
                      }`}
                    >
                      {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1">
                {notificationError ? (
                  <div className="px-4 py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-400 text-sm">{notificationError}</p>
                    <Button
                      onClick={fetchNotifications}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      Retry
                    </Button>
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <div className="divide-y divide-charcoal-700">
                    {filteredNotifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.link) {
                            window.location.href = notif.link;
                          }
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-charcoal-700 transition-colors ${
                          !notif.isRead ? 'bg-charcoal-750' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Priority Indicator */}
                          <div className={`w-2 h-2 rounded-full mt-2 ${PRIORITY_COLORS[notif.priority]}`} />
                          
                          {/* Category Icon */}
                          <div className="flex-shrink-0 mt-0.5 text-charcoal-400">
                            {NOTIFICATION_ICONS[notif.category]}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.isRead ? 'text-white font-medium' : 'text-charcoal-300'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-charcoal-400 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-charcoal-500 mt-1">
                              {formatRelativeTime(notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
                    <p className="text-charcoal-400 text-sm">No notifications</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-charcoal-700 flex-shrink-0">
                <Link
                  href="/dashboard/notifications"
                  className="block text-center text-sm text-gold-400 hover:text-gold-300 py-1"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Settings (Admin only) */}
        {isAdmin && (
          <Link
            href="/dashboard/admin/settings"
            className="p-2 text-charcoal-400 hover:text-gold-400 hover:bg-charcoal-700 rounded-lg transition-all"
            title="Admin Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}

        {/* Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-charcoal-700 rounded-lg transition-all"
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
            aria-label="User menu"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-2 ring-charcoal-600"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-charcoal-600">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-charcoal-400 transition-transform hidden sm:block ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-charcoal-800 rounded-lg shadow-xl border border-charcoal-700 py-2 z-50"
              role="menu"
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-charcoal-700">
                <div className="flex items-center gap-3">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{user?.name}</p>
                    <p className="text-charcoal-400 text-xs truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${roleConfig.className}`}>
                    {roleConfig.label}
                  </span>
                  {user?.isSuperAdmin && primaryRole !== 'SUPERADMIN' && (
                    <span className="inline-block px-2 py-0.5 bg-pink-900 text-pink-200 text-xs font-semibold rounded-full">
                      <Shield className="w-3 h-3 inline mr-1" />
                      Super Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-3 px-4 py-2 text-charcoal-200 hover:bg-charcoal-700 text-sm transition-colors"
                  role="menuitem"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-4 py-2 text-charcoal-200 hover:bg-charcoal-700 text-sm transition-colors"
                  role="menuitem"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </Link>
                {isAdmin && (
                  <>
                    <hr className="my-1 border-charcoal-700" />
                    <Link
                      href="/dashboard/admin"
                      className="flex items-center gap-3 px-4 py-2 text-charcoal-200 hover:bg-charcoal-700 text-sm transition-colors"
                      role="menuitem"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  </>
                )}
                <Link
                  href="/dashboard/keyboard-shortcuts"
                  className="flex items-center gap-3 px-4 py-2 text-charcoal-200 hover:bg-charcoal-700 text-sm transition-colors"
                  role="menuitem"
                >
                  <Keyboard className="w-4 h-4" />
                  Keyboard Shortcuts
                </Link>
              </div>

              {/* Sign Out */}
              <div className="border-t border-charcoal-700 pt-1 mt-1">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-950/50 text-sm transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

AdminHeader.displayName = 'AdminHeader';

export default AdminHeader;
