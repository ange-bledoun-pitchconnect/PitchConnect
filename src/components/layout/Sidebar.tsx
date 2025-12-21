'use client';

/**
 * 🌟 PITCHCONNECT - Enhanced Sidebar Component
 * Path: /src/components/layout/Sidebar.tsx
 *
 * ============================================================================
 * ENTERPRISE FEATURES
 * ============================================================================
 * ✅ Proper named export (DashboardSidebar)
 * ✅ Mobile-first responsive navigation
 * ✅ Smooth transitions for collapse/expand
 * ✅ Touch-optimized interactions
 * ✅ Role-based menu items with granular control
 * ✅ Dark mode support with color variables
 * ✅ Accessibility (ARIA labels, keyboard navigation)
 * ✅ Performance optimized (React hooks, memoization)
 * ✅ Type-safe with full TypeScript support
 * ✅ Avatar fallback with initials
 * ✅ Notification badge support
 * ✅ Smooth logout with session cleanup
 * ✅ Active route highlighting with indicators
 * ✅ Scrollbar styling
 * ✅ Error boundary ready
 * ============================================================================
 */

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
  Shield,
  Dumbbell,
  FileText,
  Award,
  Video,
  Bell,
  LogOut,
  User,
  Loader2,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  badge?: string | number;
  submenu?: MenuItem[];
  description?: string;
}

type UserRole =
  | 'PLAYER'
  | 'COACH'
  | 'CLUBMANAGER'
  | 'CLUBOWNER'
  | 'LEAGUEADMIN'
  | 'ANALYST'
  | 'PARENT'
  | 'ADMIN';

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  roles?: UserRole[];
  firstName?: string;
  lastName?: string;
}

// ============================================================================
// MENU CONFIGURATION
// ============================================================================

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-5 h-5" />,
    roles: ['PLAYER', 'COACH', 'CLUBMANAGER', 'CLUBOWNER', 'LEAGUEADMIN', 'ANALYST', 'PARENT', 'ADMIN'],
    description: 'Overview and key metrics',
  },
  {
    label: 'My Teams',
    href: '/dashboard/teams',
    icon: <Users className="w-5 h-5" />,
    roles: ['PLAYER', 'COACH', 'CLUBMANAGER', 'CLUBOWNER', 'PARENT'],
    description: 'Team management and roster',
  },
  {
    label: 'Matches',
    href: '/dashboard/matches',
    icon: <Trophy className="w-5 h-5" />,
    roles: ['PLAYER', 'COACH', 'CLUBMANAGER', 'CLUBOWNER', 'LEAGUEADMIN', 'ANALYST', 'PARENT', 'ADMIN'],
    description: 'Fixtures, results, and schedules',
  },
  {
    label: 'Training',
    href: '/dashboard/training',
    icon: <Dumbbell className="w-5 h-5" />,
    roles: ['PLAYER', 'COACH', 'CLUBMANAGER', 'ANALYST'],
    description: 'Training sessions and drills',
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['COACH', 'CLUBMANAGER', 'CLUBOWNER', 'LEAGUEADMIN', 'ANALYST', 'ADMIN'],
    description: 'Performance metrics and insights',
  },
  {
    label: 'Leagues',
    href: '/dashboard/leagues',
    icon: <Award className="w-5 h-5" />,
    roles: ['LEAGUEADMIN', 'CLUBMANAGER', 'CLUBOWNER', 'ADMIN'],
    description: 'League management and standings',
  },
  {
    label: 'Videos',
    href: '/dashboard/videos',
    icon: <Video className="w-5 h-5" />,
    roles: ['PLAYER', 'COACH', 'CLUBMANAGER', 'CLUBOWNER', 'ANALYST', 'PARENT', 'ADMIN'],
    description: 'Video library and streaming',
  },
  {
    label: 'Schedule',
    href: '/dashboard/schedule',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['PLAYER', 'COACH', 'CLUBMANAGER', 'CLUBOWNER', 'LEAGUEADMIN', 'PARENT', 'ADMIN'],
    description: 'Calendar and event planning',
  },
  {
    label: 'Admin Panel',
    href: '/dashboard/admin',
    icon: <Shield className="w-5 h-5" />,
    roles: ['ADMIN'],
    description: 'System administration',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get user initials for avatar fallback
 */
function getUserInitials(user?: User): string {
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

/**
 * Format badge count
 */
function formatBadge(badge?: string | number): string {
  if (!badge) return '';
  if (typeof badge === 'number' && badge > 99) return '99+';
  return String(badge);
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

export function DashboardSidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // =========================================================================
  // EFFECT: DETECT MOBILE VIEWPORT
  // =========================================================================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // =========================================================================
  // EFFECT: CLOSE SIDEBAR ON ROUTE CHANGE (MOBILE)
  // =========================================================================

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  // =========================================================================
  // MEMOIZED: FILTERED MENU ITEMS
  // =========================================================================

  const filteredMenuItems = useMemo(() => {
    if (!session?.user) return [];

    const userRoles = (session.user as User).roles || [];

    return MENU_ITEMS.filter((item) => {
      return userRoles.some((role) => item.roles.includes(role));
    });
  }, [session?.user]);

  // =========================================================================
  // CALLBACK: CHECK IF MENU ITEM IS ACTIVE
  // =========================================================================

  const isActive = useCallback(
    (href: string) => {
      if (href === '/dashboard') {
        return pathname === href;
      }
      return pathname?.startsWith(href) || false;
    },
    [pathname]
  );

  // =========================================================================
  // CALLBACK: HANDLE LOGOUT
  // =========================================================================

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await signOut({
        redirect: true,
        callbackUrl: '/auth/login',
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }, []);

  // =========================================================================
  // CALLBACK: TOGGLE SIDEBAR
  // =========================================================================

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // =========================================================================
  // CALLBACK: CLOSE SIDEBAR
  // =========================================================================

  const closeSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const user = session?.user as User | undefined;

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <>
      {/* ===================================================================
          MOBILE MENU BUTTON
          =================================================================== */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-charcoal-800 border border-neutral-200 dark:border-charcoal-700 rounded-lg shadow-lg hover:bg-neutral-50 dark:hover:bg-charcoal-700 transition-all duration-200"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="sidebar-nav"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-charcoal-900 dark:text-white" aria-hidden="true" />
        ) : (
          <Menu className="w-6 h-6 text-charcoal-900 dark:text-white" aria-hidden="true" />
        )}
      </button>

      {/* ===================================================================
          OVERLAY (Mobile only)
          =================================================================== */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ===================================================================
          SIDEBAR NAVIGATION
          =================================================================== */}
      <aside
        id="sidebar-nav"
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-charcoal-800 border-r border-neutral-200 dark:border-charcoal-700 z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* =================================================================
            LOGO/BRAND SECTION
            ================================================================= */}
        <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group"
            onClick={closeSidebar}
            aria-label="PitchConnect Dashboard"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md">
              <Trophy className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal-900 dark:text-white">
                PitchConnect
              </h1>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                Sports Management
              </p>
            </div>
          </Link>
        </div>

        {/* =================================================================
            USER INFO SECTION
            ================================================================= */}
        {user && (
          <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700 hover:bg-neutral-50 dark:hover:bg-charcoal-700/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {getUserInitials(user)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal-900 dark:text-white truncate">
                  {user.name || `${user.firstName} ${user.lastName}`.trim() || 'User'}
                </p>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            NAVIGATION MENU
            ================================================================= */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-charcoal-300 dark:scrollbar-thumb-charcoal-600">
          {filteredMenuItems.length > 0 ? (
            <ul className="space-y-1">
              {filteredMenuItems.map((item) => {
                const active = isActive(item.href);
                const badgeText = formatBadge(item.badge);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                        ${
                          active
                            ? 'bg-gradient-to-r from-gold-50 to-orange-50 dark:from-gold-900/30 dark:to-orange-900/30 text-gold-700 dark:text-gold-300 font-semibold shadow-sm'
                            : 'text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 hover:text-charcoal-900 dark:hover:text-white'
                        }
                      `}
                      aria-current={active ? 'page' : undefined}
                      title={item.description}
                    >
                      <span
                        className={`${
                          active
                            ? 'text-gold-600 dark:text-gold-400'
                            : 'text-charcoal-500 dark:text-charcoal-400 group-hover:text-charcoal-700 dark:group-hover:text-charcoal-200'
                        } transition-all duration-200`}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {badgeText && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full flex-shrink-0 shadow-md">
                          {badgeText}
                        </span>
                      )}
                      {active && (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      )}
                      {active && (
                        <div
                          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold-500 to-orange-400 rounded-r"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-32 text-charcoal-500 dark:text-charcoal-400">
              <p className="text-sm">No menu items available</p>
            </div>
          )}
        </nav>

        {/* =================================================================
            FOOTER ACTIONS
            ================================================================= */}
        <div className="border-t border-neutral-200 dark:border-charcoal-700 space-y-2 p-4">
          {/* Settings Link */}
          <Link
            href="/dashboard/settings"
            onClick={closeSidebar}
            className="flex items-center gap-3 px-4 py-3 text-charcoal-600 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700 hover:text-charcoal-900 dark:hover:text-white rounded-lg transition-all duration-200 group"
            aria-label="Go to settings"
          >
            <Settings
              className="w-5 h-5 text-charcoal-500 dark:text-charcoal-400 group-hover:text-charcoal-700 dark:group-hover:text-charcoal-200 transition-colors"
              aria-hidden="true"
            />
            <span>Settings</span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${
                isLoggingOut
                  ? 'text-charcoal-400 dark:text-charcoal-500 cursor-not-allowed'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300'
              }
            `}
            aria-label="Sign out from PitchConnect"
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="w-5 h-5" aria-hidden="true" />
            )}
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>

        {/* =================================================================
            VERSION INFO
            ================================================================= */}
        <div className="p-4 text-center border-t border-neutral-200 dark:border-charcoal-700 bg-neutral-50 dark:bg-charcoal-700/50">
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Version 1.0.0
          </p>
          <p className="text-xs text-charcoal-400 dark:text-charcoal-500 mt-1">
            {status === 'loading' ? 'Loading...' : status === 'authenticated' ? 'Online' : 'Offline'}
          </p>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DashboardSidebar;

export type { MenuItem, UserRole, User };
