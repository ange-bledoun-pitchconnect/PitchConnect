/**
 * ============================================================================
 * Dashboard Header Component
 * ============================================================================
 * 
 * Enterprise-grade dashboard header with role switcher, search, notifications,
 * and user profile management.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/layout/DashboardHeader.tsx
 * 
 * FEATURES:
 * - Role switcher for multi-role users
 * - Team/Sport context filter
 * - Global search integration
 * - Dynamic create button based on role
 * - Notifications dropdown
 * - Quick actions menu
 * - User profile menu
 * - Dark mode toggle
 * - Mobile responsive
 * - Keyboard shortcuts
 * - Accessibility compliant
 * 
 * USER ROLES SUPPORTED:
 * All 19 user roles with appropriate permissions
 * 
 * ============================================================================
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Search,
  Moon,
  Sun,
  Keyboard,
  HelpCircle,
  X,
  Check,
  Building2,
  Users,
  Trophy,
  Calendar,
  FileText,
  Briefcase,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  type UserRole,
  USER_ROLE_CONFIG,
  getRoleConfig,
} from '@/config/user-roles-config';
import { type Sport, SPORT_CONFIG, ALL_SPORTS } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

interface Team {
  id: string;
  name: string;
  sport?: Sport;
  logo?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  roles: UserRole[];
  shortcut?: string;
}

interface DashboardHeaderProps {
  /** Available teams for filter */
  teams?: Team[];
  /** Currently selected teams */
  selectedTeams?: string[];
  /** Team selection change handler */
  onTeamChange?: (teamIds: string[]) => void;
  /** Current sport context */
  sport?: Sport;
  /** Sport change handler */
  onSportChange?: (sport: Sport) => void;
  /** Notifications list */
  notifications?: Notification[];
  /** Notification count (can be different from notifications length) */
  notificationCount?: number;
  /** Mark notification as read */
  onMarkNotificationRead?: (id: string) => void;
  /** Mark all notifications as read */
  onMarkAllNotificationsRead?: () => void;
  /** Create button click handler */
  onCreateClick?: () => void;
  /** Show sport selector */
  showSportSelector?: boolean;
  /** Show team filter */
  showTeamFilter?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// QUICK ACTIONS CONFIGURATION
// =============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'new-match',
    label: 'New Match',
    icon: Trophy,
    href: '/dashboard/matches/new',
    roles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
    shortcut: '⌘M',
  },
  {
    id: 'new-player',
    label: 'Add Player',
    icon: UserPlus,
    href: '/dashboard/players/new',
    roles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
    shortcut: '⌘P',
  },
  {
    id: 'new-team',
    label: 'Create Team',
    icon: Users,
    href: '/dashboard/teams/new',
    roles: ['CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
    shortcut: '⌘T',
  },
  {
    id: 'new-club',
    label: 'Create Club',
    icon: Building2,
    href: '/dashboard/clubs/new',
    roles: ['LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
  },
  {
    id: 'new-event',
    label: 'Schedule Event',
    icon: Calendar,
    href: '/dashboard/schedule/new',
    roles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
  },
  {
    id: 'new-job',
    label: 'Post Job',
    icon: Briefcase,
    href: '/dashboard/jobs/new',
    roles: ['CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
  },
  {
    id: 'new-report',
    label: 'Create Report',
    icon: FileText,
    href: '/dashboard/reports/new',
    roles: ['COACH_PRO', 'ANALYST', 'SCOUT', 'CLUB_MANAGER', 'ADMIN', 'SUPERADMIN'],
  },
];

// =============================================================================
// ROLE DASHBOARD PATHS
// =============================================================================

const ROLE_DASHBOARD_PATHS: Partial<Record<UserRole, { path: string; label: string }>> = {
  SUPERADMIN: { path: '/dashboard/superadmin', label: 'Super Admin' },
  ADMIN: { path: '/dashboard/admin', label: 'Admin' },
  PLAYER: { path: '/dashboard/player', label: 'Player' },
  PLAYER_PRO: { path: '/dashboard/player', label: 'Pro Player' },
  COACH: { path: '/dashboard/coach', label: 'Coach' },
  COACH_PRO: { path: '/dashboard/coach', label: 'Pro Coach' },
  MANAGER: { path: '/dashboard/manager', label: 'Manager' },
  CLUB_MANAGER: { path: '/dashboard/club-manager', label: 'Club Manager' },
  CLUB_OWNER: { path: '/dashboard/owner', label: 'Owner' },
  LEAGUE_ADMIN: { path: '/dashboard/league-admin', label: 'League Admin' },
  REFEREE: { path: '/dashboard/referee', label: 'Referee' },
  SCOUT: { path: '/dashboard/scout', label: 'Scout' },
  ANALYST: { path: '/dashboard/analyst', label: 'Analyst' },
  TREASURER: { path: '/dashboard/treasurer', label: 'Treasurer' },
  MEDICAL_STAFF: { path: '/dashboard/medical', label: 'Medical' },
  MEDIA_MANAGER: { path: '/dashboard/media', label: 'Media' },
  PARENT: { path: '/dashboard/parent', label: 'Parent' },
  GUARDIAN: { path: '/dashboard/parent', label: 'Guardian' },
  FAN: { path: '/dashboard/fan', label: 'Fan' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function DashboardHeader({
  teams = [],
  selectedTeams = [],
  onTeamChange,
  sport,
  onSportChange,
  notifications = [],
  notificationCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onCreateClick,
  showSportSelector = false,
  showTeamFilter = true,
  className,
}: DashboardHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get user roles
  const userRoles = useMemo<UserRole[]>(() => {
    const roles = (session?.user as any)?.roles;
    return roles?.length ? roles : ['FAN'];
  }, [session]);

  // Get primary role
  const primaryRole = useMemo(() => userRoles[0] || 'FAN', [userRoles]);
  const primaryRoleConfig = useMemo(() => getRoleConfig(primaryRole), [primaryRole]);

  // Get sport config
  const sportConfig = useMemo(() => {
    return sport ? SPORT_CONFIG[sport] : null;
  }, [sport]);

  // Get available quick actions based on roles
  const availableQuickActions = useMemo(() => {
    return QUICK_ACTIONS.filter((action) =>
      action.roles.some((role) => userRoles.includes(role))
    );
  }, [userRoles]);

  // Get available role dashboards
  const availableRoleDashboards = useMemo(() => {
    return userRoles
      .filter((role) => ROLE_DASHBOARD_PATHS[role])
      .map((role) => ({
        role,
        ...ROLE_DASHBOARD_PATHS[role]!,
        config: getRoleConfig(role),
      }));
  }, [userRoles]);

  // Get current role from pathname
  const currentRolePath = useMemo(() => {
    for (const { role, path } of availableRoleDashboards) {
      if (pathname.startsWith(path)) {
        return { role, path };
      }
    }
    return null;
  }, [pathname, availableRoleDashboards]);

  // Unread notification count
  const unreadCount = notificationCount ?? notifications.filter((n) => !n.read).length;

  // Primary create action based on role
  const primaryCreateAction = useMemo(() => {
    const roleActions: Partial<Record<UserRole, QuickAction>> = {
      SUPERADMIN: QUICK_ACTIONS.find((a) => a.id === 'new-club'),
      ADMIN: QUICK_ACTIONS.find((a) => a.id === 'new-club'),
      LEAGUE_ADMIN: QUICK_ACTIONS.find((a) => a.id === 'new-club'),
      CLUB_OWNER: QUICK_ACTIONS.find((a) => a.id === 'new-team'),
      CLUB_MANAGER: QUICK_ACTIONS.find((a) => a.id === 'new-team'),
      MANAGER: QUICK_ACTIONS.find((a) => a.id === 'new-match'),
      COACH_PRO: QUICK_ACTIONS.find((a) => a.id === 'new-match'),
      COACH: QUICK_ACTIONS.find((a) => a.id === 'new-match'),
      ANALYST: QUICK_ACTIONS.find((a) => a.id === 'new-report'),
      SCOUT: QUICK_ACTIONS.find((a) => a.id === 'new-report'),
    };

    return roleActions[primaryRole] || QUICK_ACTIONS.find((a) => a.id === 'new-event');
  }, [primaryRole]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // Escape to close search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  // Handle role switch
  const handleRoleSwitch = (path: string) => {
    router.push(path);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full bg-white dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700',
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          {/* Role Switcher (for multi-role users) */}
          {availableRoleDashboards.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hidden sm:flex"
                >
                  <span>{primaryRoleConfig.emoji}</span>
                  <span className="max-w-[120px] truncate">
                    {currentRolePath
                      ? ROLE_DASHBOARD_PATHS[currentRolePath.role]?.label
                      : primaryRoleConfig.shortLabel}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Dashboard</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableRoleDashboards.map(({ role, path, label, config }) => {
                  const isActive = currentRolePath?.role === role;
                  return (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleSwitch(path)}
                      className={cn(isActive && 'bg-primary/10')}
                    >
                      <span className="mr-2">{config.emoji}</span>
                      {label}
                      {isActive && <Check className="w-4 h-4 ml-auto" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Sport Selector */}
          {showSportSelector && onSportChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {sportConfig ? (
                    <>
                      <span>{sportConfig.icon}</span>
                      <span className="hidden sm:inline">{sportConfig.name}</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4" />
                      <span className="hidden sm:inline">All Sports</span>
                    </>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                <DropdownMenuLabel>Select Sport</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_SPORTS.map((s) => {
                  const config = SPORT_CONFIG[s];
                  return (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => onSportChange(s)}
                      className={cn(sport === s && 'bg-primary/10')}
                    >
                      <span className="mr-2">{config.icon}</span>
                      {config.name}
                      {sport === s && <Check className="w-4 h-4 ml-auto" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Team Filter */}
          {showTeamFilter && teams.length > 0 && onTeamChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                  <Users className="w-4 h-4" />
                  <span>
                    {selectedTeams.length === 0
                      ? 'All Teams'
                      : selectedTeams.length === 1
                      ? teams.find((t) => t.id === selectedTeams[0])?.name
                      : `${selectedTeams.length} Teams`}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                <DropdownMenuLabel>Filter by Team</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onTeamChange([])}
                  className={cn(selectedTeams.length === 0 && 'bg-primary/10')}
                >
                  All Teams
                  {selectedTeams.length === 0 && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {teams.map((team) => {
                  const isSelected = selectedTeams.includes(team.id);
                  const teamSport = team.sport ? SPORT_CONFIG[team.sport] : null;
                  return (
                    <DropdownMenuItem
                      key={team.id}
                      onClick={() => {
                        if (isSelected) {
                          onTeamChange(selectedTeams.filter((id) => id !== team.id));
                        } else {
                          onTeamChange([...selectedTeams, team.id]);
                        }
                      }}
                      className={cn(isSelected && 'bg-primary/10')}
                    >
                      {teamSport && <span className="mr-2">{teamSport.icon}</span>}
                      <span className="truncate">{team.name}</span>
                      {isSelected && <Check className="w-4 h-4 ml-auto" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players, clubs, matches..."
                className="w-full pl-10 pr-20 py-2 bg-neutral-100 dark:bg-charcoal-700 border border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-charcoal-800 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-charcoal-400 bg-white dark:bg-charcoal-600 rounded border border-neutral-200 dark:border-charcoal-500">
                ⌘K
              </kbd>
            </form>
          </div>

          {/* Search Button (Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(true)}
            className="lg:hidden"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {availableQuickActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {primaryCreateAction?.label || 'Create'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={() => {
                        if (action.onClick) {
                          action.onClick();
                        } else if (action.href) {
                          router.push(action.href);
                        }
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {action.label}
                      {action.shortcut && (
                        <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between p-3 border-b">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && onMarkAllNotificationsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllNotificationsRead}
                    className="text-xs h-auto py-1"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-2" />
                  <p className="text-sm text-charcoal-500">No notifications</p>
                </div>
              ) : (
                <div className="py-1">
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => {
                        onMarkNotificationRead?.(notification.id);
                        if (notification.link) {
                          router.push(notification.link);
                        }
                      }}
                      className={cn(
                        'flex-col items-start gap-1 p-3 cursor-pointer',
                        !notification.read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            notification.type === 'success' && 'bg-green-500',
                            notification.type === 'warning' && 'bg-amber-500',
                            notification.type === 'error' && 'bg-red-500',
                            notification.type === 'info' && 'bg-blue-500'
                          )}
                        />
                        <span className="font-medium text-sm truncate flex-1">
                          {notification.title}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 line-clamp-2">
                        {notification.message}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications" className="justify-center font-medium">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark Mode Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="hidden sm:flex">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 pl-2 pr-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={(session?.user as any)?.image} />
                  <AvatarFallback className={cn(primaryRoleConfig.bgColor, primaryRoleConfig.textColor)}>
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-3 border-b">
                <p className="font-semibold text-sm truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-charcoal-500 truncate">
                  {session?.user?.email}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {primaryRoleConfig.emoji} {primaryRoleConfig.shortLabel}
                </Badge>
              </div>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                    <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleDarkMode} className="sm:hidden">
                  {isDarkMode ? (
                    <>
                      <Sun className="w-4 h-4 mr-2" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-2" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="text-red-600 dark:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden">
          <div className="absolute top-0 left-0 right-0 p-4 bg-white dark:bg-charcoal-800">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-full pl-12 pr-12 py-3 bg-neutral-100 dark:bg-charcoal-700 border border-neutral-200 dark:border-charcoal-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;

export type { DashboardHeaderProps, Team, Notification, QuickAction };
