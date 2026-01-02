/**
 * ============================================================================
 * Dashboard Sidebar Component
 * ============================================================================
 * 
 * Enterprise-grade sidebar navigation with role-based menu items,
 * multi-sport awareness, and full accessibility support.
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/layout/Sidebar.tsx
 * 
 * FEATURES:
 * - Role-based menu filtering (19 user roles)
 * - Sport-context awareness
 * - Collapsible/expandable state
 * - Mobile-first responsive design
 * - Smooth animations
 * - Notification badges
 * - Active route highlighting
 * - User profile section
 * - Quick actions
 * - Dark mode support
 * - Keyboard navigation
 * - ARIA accessibility
 * 
 * USER ROLES SUPPORTED:
 * SUPERADMIN, ADMIN, PLAYER, PLAYER_PRO, COACH, COACH_PRO,
 * MANAGER, CLUB_MANAGER, CLUB_OWNER, TREASURER, REFEREE,
 * SCOUT, ANALYST, PARENT, GUARDIAN, LEAGUE_ADMIN,
 * MEDICAL_STAFF, MEDIA_MANAGER, FAN
 * 
 * ============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Users,
  Trophy,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  Dumbbell,
  FileText,
  Award,
  Video,
  Bell,
  LogOut,
  User,
  Loader2,
  Briefcase,
  Heart,
  Wallet,
  Whistle,
  Search,
  Stethoscope,
  Camera,
  UserCog,
  Building2,
  HelpCircle,
  MessageSquare,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type UserRole,
  USER_ROLE_CONFIG,
  getRoleConfig,
} from '@/config/user-roles-config';
import { type Sport, SPORT_CONFIG } from '@/config/sport-dashboard-config';

// =============================================================================
// TYPES
// =============================================================================

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string | number;
  badgeColor?: 'red' | 'blue' | 'green' | 'amber';
  submenu?: MenuItem[];
  description?: string;
  isNew?: boolean;
  isExternal?: boolean;
}

interface UserSession {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  roles?: UserRole[];
  firstName?: string;
  lastName?: string;
  activeSport?: Sport;
}

interface SidebarProps {
  /** Collapsed state (controlled) */
  collapsed?: boolean;
  /** Collapse change handler */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Current sport context */
  sport?: Sport;
  /** Notification count */
  notificationCount?: number;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// MENU CONFIGURATION
// =============================================================================

const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: [
      'SUPERADMIN', 'ADMIN', 'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO',
      'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'TREASURER', 'REFEREE',
      'SCOUT', 'ANALYST', 'PARENT', 'GUARDIAN', 'LEAGUE_ADMIN',
      'MEDICAL_STAFF', 'MEDIA_MANAGER', 'FAN',
    ],
    description: 'Overview and key metrics',
  },
  {
    id: 'teams',
    label: 'My Teams',
    href: '/dashboard/teams',
    icon: Users,
    roles: [
      'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER',
      'CLUB_MANAGER', 'CLUB_OWNER', 'PARENT', 'GUARDIAN', 'ANALYST',
    ],
    description: 'Team management and roster',
  },
  {
    id: 'matches',
    label: 'Matches',
    href: '/dashboard/matches',
    icon: Trophy,
    roles: [
      'SUPERADMIN', 'ADMIN', 'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO',
      'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'REFEREE', 'ANALYST',
      'PARENT', 'GUARDIAN', 'LEAGUE_ADMIN', 'MEDIA_MANAGER', 'FAN',
    ],
    description: 'Fixtures, results, and schedules',
  },
  {
    id: 'training',
    label: 'Training',
    href: '/dashboard/training',
    icon: Dumbbell,
    roles: [
      'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER',
      'CLUB_MANAGER', 'ANALYST', 'MEDICAL_STAFF',
    ],
    description: 'Training sessions and drills',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: [
      'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER',
      'LEAGUE_ADMIN', 'ANALYST', 'SCOUT', 'ADMIN', 'SUPERADMIN',
    ],
    description: 'Performance metrics and insights',
  },
  {
    id: 'players',
    label: 'Players',
    href: '/dashboard/players',
    icon: User,
    roles: [
      'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER',
      'SCOUT', 'ANALYST', 'MEDICAL_STAFF', 'ADMIN', 'SUPERADMIN',
    ],
    description: 'Player profiles and management',
  },
  {
    id: 'scouting',
    label: 'Scouting',
    href: '/dashboard/scouting',
    icon: Search,
    roles: ['SCOUT', 'COACH_PRO', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
    description: 'Talent identification and reports',
  },
  {
    id: 'medical',
    label: 'Medical',
    href: '/dashboard/medical',
    icon: Stethoscope,
    roles: ['MEDICAL_STAFF', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'ADMIN', 'SUPERADMIN'],
    description: 'Injuries and player health',
  },
  {
    id: 'leagues',
    label: 'Leagues',
    href: '/dashboard/leagues',
    icon: Award,
    roles: ['LEAGUE_ADMIN', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
    description: 'League management and standings',
  },
  {
    id: 'officiating',
    label: 'Officiating',
    href: '/dashboard/officiating',
    icon: Whistle,
    roles: ['REFEREE', 'LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
    description: 'Match assignments and reports',
  },
  {
    id: 'finances',
    label: 'Finances',
    href: '/dashboard/finances',
    icon: Wallet,
    roles: ['TREASURER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
    description: 'Budget and financial reports',
  },
  {
    id: 'media',
    label: 'Media',
    href: '/dashboard/media',
    icon: Camera,
    roles: ['MEDIA_MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
    description: 'Content and communications',
  },
  {
    id: 'videos',
    label: 'Videos',
    href: '/dashboard/videos',
    icon: Video,
    roles: [
      'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER',
      'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'PARENT', 'GUARDIAN',
      'MEDIA_MANAGER', 'ADMIN', 'SUPERADMIN',
    ],
    description: 'Video library and streaming',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    href: '/dashboard/schedule',
    icon: Calendar,
    roles: [
      'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER',
      'CLUB_MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN', 'REFEREE',
      'PARENT', 'GUARDIAN', 'ADMIN', 'SUPERADMIN',
    ],
    description: 'Calendar and event planning',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    href: '/dashboard/jobs',
    icon: Briefcase,
    roles: [
      'PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER',
      'CLUB_MANAGER', 'CLUB_OWNER', 'REFEREE', 'SCOUT', 'ANALYST',
      'MEDICAL_STAFF', 'MEDIA_MANAGER', 'ADMIN', 'SUPERADMIN',
    ],
    description: 'Job opportunities',
    isNew: true,
  },
  {
    id: 'family',
    label: 'Family',
    href: '/dashboard/family',
    icon: Heart,
    roles: ['PARENT', 'GUARDIAN'],
    description: 'Manage linked players',
  },
];

const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'admin',
    label: 'Admin Panel',
    href: '/dashboard/admin',
    icon: Shield,
    roles: ['ADMIN', 'SUPERADMIN'],
    description: 'System administration',
  },
  {
    id: 'users',
    label: 'User Management',
    href: '/dashboard/admin/users',
    icon: UserCog,
    roles: ['ADMIN', 'SUPERADMIN'],
    description: 'Manage user accounts',
  },
  {
    id: 'clubs',
    label: 'Club Management',
    href: '/dashboard/admin/clubs',
    icon: Building2,
    roles: ['ADMIN', 'SUPERADMIN', 'LEAGUE_ADMIN'],
    description: 'Manage clubs',
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getUserInitials(user?: UserSession): string {
  if (!user) return '?';

  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  if (user.name) {
    const parts = user.name.split(' ');
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  return user.email?.[0]?.toUpperCase() || '?';
}

function formatBadge(badge?: string | number): string {
  if (!badge) return '';
  if (typeof badge === 'number' && badge > 99) return '99+';
  return String(badge);
}

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

export function DashboardSidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  sport,
  notificationCount = 0,
  className,
}: SidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use controlled or internal collapsed state
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  // Get user from session
  const user = useMemo<UserSession | undefined>(() => {
    if (!session?.user) return undefined;
    return session.user as UserSession;
  }, [session]);

  // Get user roles (default to FAN if none)
  const userRoles = useMemo<UserRole[]>(() => {
    return user?.roles?.length ? user.roles : ['FAN'];
  }, [user]);

  // Get primary role config
  const primaryRoleConfig = useMemo(() => {
    const primaryRole = userRoles[0] || 'FAN';
    return getRoleConfig(primaryRole);
  }, [userRoles]);

  // Get sport config
  const sportConfig = useMemo(() => {
    const activeSport = sport || user?.activeSport;
    return activeSport ? SPORT_CONFIG[activeSport] : null;
  }, [sport, user?.activeSport]);

  // Filter menu items based on user roles
  const filteredMainMenu = useMemo(() => {
    return MAIN_MENU_ITEMS.filter((item) =>
      item.roles.some((role) => userRoles.includes(role))
    );
  }, [userRoles]);

  const filteredAdminMenu = useMemo(() => {
    return ADMIN_MENU_ITEMS.filter((item) =>
      item.roles.some((role) => userRoles.includes(role))
    );
  }, [userRoles]);

  // Check if path is active
  const isActive = useCallback(
    (href: string): boolean => {
      if (href === '/dashboard') return pathname === '/dashboard';
      return pathname.startsWith(href);
    },
    [pathname]
  );

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/auth/login' });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Close sidebar (mobile)
  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Render menu item
  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.href);
    const badgeText = formatBadge(item.badge);
    const Icon = item.icon;

    return (
      <li key={item.id}>
        <Link
          href={item.href}
          onClick={closeSidebar}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative',
            active
              ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold'
              : 'text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 hover:text-charcoal-900 dark:hover:text-white',
            collapsed && !isMobile && 'justify-center px-2'
          )}
          aria-current={active ? 'page' : undefined}
          title={collapsed ? item.label : item.description}
        >
          {/* Active indicator */}
          {active && (
            <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r" />
          )}

          {/* Icon */}
          <span
            className={cn(
              'flex-shrink-0 transition-colors',
              active ? 'text-primary' : 'text-charcoal-500 dark:text-charcoal-400 group-hover:text-charcoal-700 dark:group-hover:text-charcoal-200'
            )}
          >
            <Icon className="w-5 h-5" />
          </span>

          {/* Label */}
          {(!collapsed || isMobile) && (
            <>
              <span className="flex-1 truncate">{item.label}</span>

              {/* New badge */}
              {item.isNew && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded">
                  NEW
                </span>
              )}

              {/* Count badge */}
              {badgeText && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-bold rounded-full flex-shrink-0',
                    item.badgeColor === 'blue' && 'bg-blue-500 text-white',
                    item.badgeColor === 'green' && 'bg-green-500 text-white',
                    item.badgeColor === 'amber' && 'bg-amber-500 text-white',
                    (!item.badgeColor || item.badgeColor === 'red') && 'bg-red-500 text-white'
                  )}
                >
                  {badgeText}
                </span>
              )}

              {/* Arrow */}
              {active && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            </>
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed top-4 left-4 z-50 p-2 bg-white dark:bg-charcoal-800 rounded-lg shadow-lg border border-neutral-200 dark:border-charcoal-700 lg:hidden',
          'hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors'
        )}
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
        aria-controls="sidebar-nav"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'hidden lg:flex fixed z-50 p-1.5 bg-white dark:bg-charcoal-800 rounded-full shadow-lg border border-neutral-200 dark:border-charcoal-700',
          'hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-all',
          collapsed ? 'left-[72px]' : 'left-[248px]',
          'top-20 -translate-x-1/2'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Overlay (Mobile) */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen z-40 flex flex-col',
          'bg-white dark:bg-charcoal-800 border-r border-neutral-200 dark:border-charcoal-700',
          'transition-all duration-300 ease-in-out',
          // Mobile
          isMobile && (isOpen ? 'translate-x-0' : '-translate-x-full'),
          // Desktop
          !isMobile && (collapsed ? 'w-20' : 'w-64'),
          // Mobile width
          isMobile && 'w-72',
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo Section */}
        <div className={cn(
          'p-4 border-b border-neutral-200 dark:border-charcoal-700',
          collapsed && !isMobile && 'px-2'
        )}>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group"
            onClick={closeSidebar}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-md flex-shrink-0">
              {sportConfig ? (
                <span className="text-xl">{sportConfig.icon}</span>
              ) : (
                <Trophy className="w-6 h-6 text-white" />
              )}
            </div>
            {(!collapsed || isMobile) && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-charcoal-900 dark:text-white truncate">
                  PitchConnect
                </h1>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                  {sportConfig?.name || 'Sports Management'}
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* User Section */}
        {user && (
          <div className={cn(
            'p-4 border-b border-neutral-200 dark:border-charcoal-700',
            collapsed && !isMobile && 'px-2 py-3'
          )}>
            <div className={cn(
              'flex items-center gap-3',
              collapsed && !isMobile && 'justify-center'
            )}>
              <div
                className={cn(
                  'rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden',
                  primaryRoleConfig.bgColor,
                  collapsed && !isMobile ? 'w-10 h-10' : 'w-12 h-12'
                )}
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className={cn('font-bold', primaryRoleConfig.textColor)}>
                    {getUserInitials(user)}
                  </span>
                )}
              </div>
              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal-900 dark:text-white truncate">
                    {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                  </p>
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400 truncate flex items-center gap-1">
                    <span>{primaryRoleConfig.emoji}</span>
                    {primaryRoleConfig.shortLabel}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-charcoal-300 dark:scrollbar-thumb-charcoal-600">
          {filteredMainMenu.length > 0 ? (
            <ul className="space-y-1">{filteredMainMenu.map(renderMenuItem)}</ul>
          ) : (
            <div className="flex items-center justify-center h-32 text-charcoal-500 dark:text-charcoal-400">
              <p className="text-sm">No menu items available</p>
            </div>
          )}

          {/* Admin Section */}
          {filteredAdminMenu.length > 0 && (
            <>
              <div className="my-4 px-4">
                <div className="border-t border-neutral-200 dark:border-charcoal-700" />
              </div>
              {(!collapsed || isMobile) && (
                <p className="px-4 mb-2 text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                  Administration
                </p>
              )}
              <ul className="space-y-1">{filteredAdminMenu.map(renderMenuItem)}</ul>
            </>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-neutral-200 dark:border-charcoal-700 p-3 space-y-1">
          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
              'text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700',
              collapsed && !isMobile && 'justify-center px-2'
            )}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </div>
            {(!collapsed || isMobile) && <span>Notifications</span>}
          </Link>

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
              'text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700',
              collapsed && !isMobile && 'justify-center px-2'
            )}
          >
            <Settings className="w-5 h-5" />
            {(!collapsed || isMobile) && <span>Settings</span>}
          </Link>

          {/* Help */}
          <Link
            href="/help"
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
              'text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700',
              collapsed && !isMobile && 'justify-center px-2'
            )}
          >
            <HelpCircle className="w-5 h-5" />
            {(!collapsed || isMobile) && <span>Help & Support</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
              'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              collapsed && !isMobile && 'justify-center px-2'
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            {(!collapsed || isMobile) && (
              <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            )}
          </button>
        </div>

        {/* Version */}
        {(!collapsed || isMobile) && (
          <div className="p-3 text-center border-t border-neutral-200 dark:border-charcoal-700 bg-neutral-50 dark:bg-charcoal-900/50">
            <p className="text-xs text-charcoal-400 dark:text-charcoal-500">
              v2.0.0 • {status === 'authenticated' ? '🟢 Online' : '🔴 Offline'}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

DashboardSidebar.displayName = 'DashboardSidebar';

export default DashboardSidebar;

export type { MenuItem, UserSession, SidebarProps };
