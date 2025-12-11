'use client';

/**
 * Enhanced Dashboard Header Component
 * Path: /components/layout/DashboardHeader.tsx
 * 
 * ENHANCEMENTS:
 * - Integrated GlobalSearch component
 * - Improved search bar styling
 * - Better responsive design
 * - Enhanced keyboard shortcuts
 * - Notification count badge
 * - Theme toggle support
 * - Accessibility improvements
 * 
 * Core Features:
 * - Role switcher for multi-role users
 * - Team filter dropdown
 * - Global search integration
 * - Dynamic create button based on user role
 * - Notifications dropdown with count
 * - Settings quick access
 * - Profile menu with sign out
 * 
 * Schema Aligned: Uses roles array from session
 * Role-based Logic: SuperAdmin, League Admin, Club Manager, Player, Coach
 * Components: TeamFilterDropdown, GlobalSearch
 * 
 * Business Logic:
 * - SuperAdmin, League Admin, Club Manager → Create Club button
 * - Other users → Add Team button
 * - Multi-role users can switch between dashboards
 * - Click-outside detection for dropdowns
 * - Dark mode support
 * - Keyboard shortcut support (⌘/Ctrl + K for search)
 */

import { useTeamFilter } from '@/lib/dashboard/team-context';
import { TeamFilterDropdown } from '@/components/common/TeamFilterDropdown';
import { GlobalSearch } from '@/components/search/global-search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown,
  Search,
  Zap,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardHeaderProps {
  teams?: Array<{ id: string; name: string }>;
  onAddTeam?: () => void;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

type UserRole = 'SUPERADMIN' | 'LEAGUE_ADMIN' | 'CLUB_MANAGER' | 'PLAYER' | 'COACH' | 'MANAGER' | 'PARENT' | 'REFEREE' | 'SCOUT' | 'ANALYST' | 'TREASURER';

interface RoleConfig {
  id: string;
  path: string;
  emoji: string;
  label: string;
  color: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  overview: {
    id: 'overview',
    path: 'overview',
    emoji: '📊',
    label: 'Dashboard Overview',
    color: 'gold',
  },
  superadmin: {
    id: 'superadmin',
    path: 'superadmin',
    emoji: '🛠️',
    label: 'Super Admin',
    color: 'blue',
  },
  LEAGUE_ADMIN: {
    id: 'league-admin',
    path: 'league-admin',
    emoji: '⚽',
    label: 'League Admin',
    color: 'green',
  },
  PLAYER: {
    id: 'player',
    path: 'player',
    emoji: '👤',
    label: 'Player',
    color: 'purple',
  },
  COACH: {
    id: 'coach',
    path: 'coach',
    emoji: '📋',
    label: 'Coach',
    color: 'orange',
  },
  CLUB_MANAGER: {
    id: 'manager',
    path: 'manager',
    emoji: '👔',
    label: 'Team Manager',
    color: 'pink',
  },
  MANAGER: {
    id: 'manager',
    path: 'manager',
    emoji: '👔',
    label: 'Team Manager',
    color: 'pink',
  },
};

const COLOR_MAP: Record<string, { bg: string; text: string; hover: string; dark: { bg: string; text: string; hover: string } }> = {
  gold: {
    bg: 'bg-gold-50',
    text: 'text-gold-700',
    hover: 'hover:bg-gold-100',
    dark: { bg: 'dark:bg-gold-900/20', text: 'dark:text-gold-400', hover: 'dark:hover:bg-gold-900/40' },
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-100',
    dark: { bg: 'dark:bg-blue-900/20', text: 'dark:text-blue-400', hover: 'dark:hover:bg-blue-900/40' },
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    hover: 'hover:bg-green-100',
    dark: { bg: 'dark:bg-green-900/20', text: 'dark:text-green-400', hover: 'dark:hover:bg-green-900/40' },
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-100',
    dark: { bg: 'dark:bg-purple-900/20', text: 'dark:text-purple-400', hover: 'dark:hover:bg-purple-900/40' },
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-100',
    dark: { bg: 'dark:bg-orange-900/20', text: 'dark:text-orange-400', hover: 'dark:hover:bg-orange-900/40' },
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    hover: 'hover:bg-pink-100',
    dark: { bg: 'dark:bg-pink-900/20', text: 'dark:text-pink-400', hover: 'dark:hover:bg-pink-900/40' },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DashboardHeader({
  teams = [],
  onAddTeam,
  notificationCount = 0,
  onNotificationClick,
}: DashboardHeaderProps) {
  const { data: session } = useSession();
  const { selectedTeams, setSelectedTeams } = useTeamFilter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Refs for click outside detection
  const roleSwitcherRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Get current role from pathname
   */
  const getCurrentRole = useCallback((): string | null => {
    if (pathname.startsWith('/dashboard/superadmin')) return 'superadmin';
    if (pathname.startsWith('/dashboard/league-admin')) return 'league-admin';
    if (pathname.startsWith('/dashboard/player')) return 'player';
    if (pathname.startsWith('/dashboard/coach')) return 'coach';
    if (pathname.startsWith('/dashboard/manager')) return 'manager';
    if (pathname.startsWith('/dashboard/overview')) return 'overview';
    return null;
  }, [pathname]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      if (role === 'SUPERADMIN') {
        return session?.user?.isSuperAdmin || false;
      }
      const userRoles = (session?.user?.roles as string[]) || [];
      return userRoles.includes(role);
    },
    [session]
  );

  /**
   * Get available roles for user
   */
  const getAvailableRoles = useCallback((): Array<{ role: string; config: RoleConfig }> => {
    const available: Array<{ role: string; config: RoleConfig }> = [];

    // Always add overview
    available.push({ role: 'overview', config: ROLE_CONFIGS.overview });

    // Add SuperAdmin if applicable
    if (session?.user?.isSuperAdmin) {
      available.push({ role: 'superadmin', config: ROLE_CONFIGS.superadmin });
    }

    // Add other roles based on roles array
    const userRoles = (session?.user?.roles as string[]) || [];
    if (userRoles.includes('LEAGUE_ADMIN')) {
      available.push({ role: 'LEAGUE_ADMIN', config: ROLE_CONFIGS.LEAGUE_ADMIN });
    }
    if (userRoles.includes('PLAYER')) {
      available.push({ role: 'PLAYER', config: ROLE_CONFIGS.PLAYER });
    }
    if (userRoles.includes('COACH')) {
      available.push({ role: 'COACH', config: ROLE_CONFIGS.COACH });
    }
    if (userRoles.includes('CLUB_MANAGER') || userRoles.includes('MANAGER')) {
      available.push({ role: 'CLUB_MANAGER', config: ROLE_CONFIGS.CLUB_MANAGER });
    }

    return available;
  }, [session]);

  /**
   * Determine if user has multiple roles
   */
  const hasMultipleRoles = useCallback((): boolean => {
    return getAvailableRoles().length > 1;
  }, [getAvailableRoles]);

  /**
   * Determine button config based on user role
   */
  const getCreateButtonConfig = useCallback(() => {
    const userRoles = (session?.user?.roles as string[]) || [];
    const isSuperAdmin = session?.user?.isSuperAdmin || false;

    // SuperAdmin, League Admin, and Club Managers can create clubs
    if (isSuperAdmin || userRoles.includes('LEAGUE_ADMIN') || userRoles.includes('CLUB_MANAGER')) {
      return {
        text: 'Create Club',
        action: () => router.push('/dashboard/clubs/create'),
      };
    }

    // Other users see "Add Team"
    return {
      text: 'Add Team',
      action: onAddTeam || (() => router.push('/dashboard/teams/join')),
    };
  }, [session, router, onAddTeam]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Close all dropdowns when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target as Node)) {
        setShowRoleSwitcher(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // ⌘K or Ctrl+K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowSearchMobile(true);
      }
      // Escape to close search
      if (event.key === 'Escape') {
        setShowSearchMobile(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Handle role switching
   */
  const handleRoleSwitch = useCallback(
    (role: string) => {
      setShowRoleSwitcher(false);
      const config = ROLE_CONFIGS[role];
      if (config) {
        router.push(`/dashboard/${config.path}`);
      }
    },
    [router]
  );

  /**
   * Handle notification button click
   */
  const handleNotificationClick = useCallback(() => {
    setShowNotifications((prev) => !prev);
    setShowProfileMenu(false);
    setShowRoleSwitcher(false);
    onNotificationClick?.();
  }, [onNotificationClick]);

  /**
   * Handle settings click
   */
  const handleSettingsClick = useCallback(() => {
    router.push('/dashboard/settings');
    setShowProfileMenu(false);
  }, [router]);

  /**
   * Handle profile menu toggle
   */
  const handleProfileMenuToggle = useCallback(() => {
    setShowProfileMenu((prev) => !prev);
    setShowNotifications(false);
    setShowRoleSwitcher(false);
  }, []);

  /**
   * Handle role switcher toggle
   */
  const handleRoleSwitcherToggle = useCallback(() => {
    setShowRoleSwitcher((prev) => !prev);
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, []);

  /**
   * Handle team selection change
   */
  const handleTeamChange = useCallback(
    (teamIds: string[]) => {
      setSelectedTeams(teamIds);
    },
    [setSelectedTeams]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentRole = getCurrentRole();
  const buttonConfig = getCreateButtonConfig();
  const availableRoles = getAvailableRoles();

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: Role Switcher + Team Filter + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Role Switcher - only show if user has multiple roles and on a role dashboard */}
        {hasMultipleRoles() && currentRole && (
          <div className="relative flex-shrink-0" ref={roleSwitcherRef}>
            <button
              onClick={handleRoleSwitcherToggle}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-colors font-semibold whitespace-nowrap"
              aria-expanded={showRoleSwitcher}
              aria-label="Switch role"
            >
              <span className="text-sm text-charcoal-900 dark:text-white hidden sm:inline">
                {ROLE_CONFIGS[currentRole]?.emoji} {ROLE_CONFIGS[currentRole]?.label || 'Dashboard'}
              </span>
              <span className="text-sm text-charcoal-900 dark:text-white sm:hidden">
                {ROLE_CONFIGS[currentRole]?.emoji}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-charcoal-600 dark:text-charcoal-400 transition-transform flex-shrink-0 ${
                  showRoleSwitcher ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Role Switcher Dropdown */}
            {showRoleSwitcher && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-charcoal-800 rounded-xl shadow-xl border border-neutral-200 dark:border-charcoal-700 z-50 animate-in fade-in">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wide">
                    Switch Role
                  </div>

                  {availableRoles.map(({ role, config }) => {
                    const colors = COLOR_MAP[config.color];
                    const isActive = currentRole === config.id || currentRole === config.path;

                    return (
                      <button
                        key={role}
                        onClick={() => handleRoleSwitch(role)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive
                            ? `${colors.bg} ${colors.text} ${colors.dark.bg} ${colors.dark.text} font-semibold`
                            : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700'
                        }`}
                      >
                        {config.emoji} {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Filter */}
        {teams.length > 0 && (
          <div className="flex-shrink-0 hidden sm:block">
            <TeamFilterDropdown
              teams={teams}
              selectedTeams={selectedTeams}
              onChange={handleTeamChange}
            />
          </div>
        )}

        {/* Global Search - Desktop */}
        <div className="hidden lg:block flex-1 max-w-lg">
          <GlobalSearch 
            placeholder="Search players, clubs, leagues..."
            className="w-full"
          />
        </div>

        {/* Search Mobile Icon */}
        <button
          onClick={() => setShowSearchMobile(true)}
          className="lg:hidden flex-shrink-0 p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg transition-colors"
          title="Search (⌘K)"
        >
          <Search className="w-5 h-5 text-charcoal-700 dark:text-charcoal-300" />
        </button>

        {/* Mobile Search Modal */}
        {showSearchMobile && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowSearchMobile(false)}
            />
            <div className="absolute top-0 left-0 right-0 p-4">
              <GlobalSearch
                placeholder="Search..."
                className="w-full"
                onResultSelect={() => setShowSearchMobile(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Dynamic Create Club / Add Team Button */}
        <Button
          onClick={buttonConfig.action}
          size="sm"
          className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white font-semibold transition-all hover:shadow-lg hidden sm:flex"
          aria-label={buttonConfig.text}
        >
          <Plus className="w-4 h-4 mr-2" />
          {buttonConfig.text}
        </Button>

        {/* Create Button Mobile */}
        <Button
          onClick={buttonConfig.action}
          size="sm"
          className="bg-gradient-to-r from-gold-500 to-orange-400 hover:from-gold-600 hover:to-orange-500 text-white sm:hidden"
          aria-label={buttonConfig.text}
        >
          <Plus className="w-4 h-4" />
        </Button>

        {/* Notifications Button */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNotificationClick}
            className="relative hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors"
            aria-expanded={showNotifications}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-charcoal-700 dark:text-charcoal-300" />
            {/* Notification Badge */}
            {notificationCount > 0 && (
              <Badge
                variant="primary"
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full p-0 animate-pulse"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-charcoal-800 rounded-xl shadow-xl border border-neutral-200 dark:border-charcoal-700 z-50 max-h-96 overflow-y-auto transition-colors duration-200 animate-in fade-in">
              <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700 sticky top-0 bg-white dark:bg-charcoal-800 flex items-center justify-between">
                <h3 className="font-bold text-charcoal-900 dark:text-white">Notifications</h3>
                {notificationCount > 0 && (
                  <Badge variant="primary" className="bg-blue-600">
                    {notificationCount}
                  </Badge>
                )}
              </div>
              <div className="p-2">
                {/* Sample Notification */}
                <div className="p-3 hover:bg-neutral-50 dark:hover:bg-charcoal-700 rounded-lg cursor-pointer transition-colors border-l-4 border-blue-500">
                  <p className="text-sm font-semibold text-charcoal-900 dark:text-white">
                    Welcome to PitchConnect!
                  </p>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                    Get started by creating your first club.
                  </p>
                  <p className="text-xs text-charcoal-400 dark:text-charcoal-500 mt-2">Just now</p>
                </div>

                {/* Empty State */}
                {notificationCount === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-neutral-300 dark:text-charcoal-600 mx-auto mb-2" />
                    <p className="text-sm text-charcoal-600 dark:text-charcoal-400">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSettingsClick}
          className="hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors hidden sm:inline-flex"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-charcoal-700 dark:text-charcoal-300" />
        </Button>

        {/* Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProfileMenuToggle}
            className="hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors"
            aria-expanded={showProfileMenu}
            aria-label="Profile menu"
          >
            <User className="w-5 h-5 text-charcoal-700 dark:text-charcoal-300" />
          </Button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-charcoal-800 rounded-xl shadow-xl border border-neutral-200 dark:border-charcoal-700 z-50 transition-colors duration-200 animate-in fade-in">
              <div className="p-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-charcoal-700">
                  <p className="text-sm font-semibold text-charcoal-900 dark:text-white truncate">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 truncate">
                    {session?.user?.email}
                  </p>
                </div>

                <button
                  onClick={handleSettingsClick}
                  className="w-full text-left px-4 py-2 text-sm text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-50 dark:hover:bg-charcoal-700 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

DashboardHeader.displayName = 'DashboardHeader';
