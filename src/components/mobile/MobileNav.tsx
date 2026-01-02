/**
 * ============================================================================
 * Mobile Navigation Component
 * ============================================================================
 * 
 * Enterprise-grade mobile navigation with role-based menu items.
 * Adapts to mobile (hamburger), tablet (bottom nav), and desktop (sidebar).
 * 
 * @version 2.0.0
 * @since v7.10.1
 * @path src/components/mobile/MobileNav.tsx
 * 
 * FEATURES:
 * - Role-based navigation items
 * - Sport-aware quick actions
 * - Responsive design (mobile/tablet/desktop)
 * - Touch-friendly 44px tap targets
 * - Smooth animations
 * - Active state indicators
 * - Notification badges
 * - Dark mode support
 * - Accessibility compliant
 * 
 * AFFECTED USER ROLES:
 * All 19 roles with appropriate menu filtering
 * 
 * ============================================================================
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  BarChart3,
  Search,
  Users,
  Trophy,
  Calendar,
  Settings,
  User,
  CreditCard,
  Shield,
  Activity,
  ClipboardList,
  Briefcase,
  FileText,
  Bell,
  MessageSquare,
  Video,
  Heart,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useResponsive } from '@/hooks/useResponsive';
import { type UserRole } from '@/config/user-roles-config';

// =============================================================================
// TYPES
// =============================================================================

interface NavItem {
  id: string;
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  badge?: number;
  roles: UserRole[] | 'all';
  requiresPro?: boolean;
}

interface MobileNavProps {
  /** Current user role */
  userRole: UserRole;
  /** Whether user has pro subscription */
  isPro?: boolean;
  /** Notification count */
  notificationCount?: number;
  /** Message count */
  messageCount?: number;
  /** Custom logo */
  logo?: React.ReactNode;
  /** App name */
  appName?: string;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// NAVIGATION ITEMS CONFIG
// =============================================================================

const NAV_ITEMS: NavItem[] = [
  // Core Navigation (All Users)
  {
    id: 'overview',
    href: '/dashboard/overview',
    label: 'Overview',
    shortLabel: 'Home',
    icon: Home,
    roles: 'all',
  },
  {
    id: 'calendar',
    href: '/dashboard/calendar',
    label: 'Calendar',
    shortLabel: 'Calendar',
    icon: Calendar,
    roles: 'all',
  },
  
  // Player/Coach Navigation
  {
    id: 'my-stats',
    href: '/dashboard/my-stats',
    label: 'My Stats',
    shortLabel: 'Stats',
    icon: BarChart3,
    roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO'],
  },
  {
    id: 'training',
    href: '/dashboard/training',
    label: 'Training',
    shortLabel: 'Training',
    icon: Activity,
    roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER'],
  },
  {
    id: 'matches',
    href: '/dashboard/matches',
    label: 'Matches',
    shortLabel: 'Matches',
    icon: Trophy,
    roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER', 'REFEREE', 'ANALYST', 'FAN'],
  },
  
  // Team Management
  {
    id: 'team',
    href: '/dashboard/team',
    label: 'My Team',
    shortLabel: 'Team',
    icon: Users,
    roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER'],
  },
  {
    id: 'squad',
    href: '/dashboard/squad',
    label: 'Squad',
    shortLabel: 'Squad',
    icon: ClipboardList,
    roles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER'],
  },
  
  // Analytics (Pro)
  {
    id: 'analytics',
    href: '/dashboard/analytics',
    label: 'Analytics',
    shortLabel: 'Analytics',
    icon: BarChart3,
    roles: ['PLAYER_PRO', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'ANALYST', 'ADMIN', 'SUPERADMIN'],
    requiresPro: true,
  },
  
  // Club Management
  {
    id: 'club',
    href: '/dashboard/club',
    label: 'Club',
    shortLabel: 'Club',
    icon: Shield,
    roles: ['CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
  },
  {
    id: 'finances',
    href: '/dashboard/finances',
    label: 'Finances',
    shortLabel: 'Finance',
    icon: CreditCard,
    roles: ['TREASURER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
  },
  
  // League Management
  {
    id: 'league',
    href: '/dashboard/league',
    label: 'League',
    shortLabel: 'League',
    icon: Trophy,
    roles: ['LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
  },
  {
    id: 'standings',
    href: '/dashboard/standings',
    label: 'Standings',
    shortLabel: 'Table',
    icon: Trophy,
    roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'MANAGER', 'FAN', 'MEDIA_MANAGER'],
  },
  
  // Referee
  {
    id: 'assignments',
    href: '/dashboard/assignments',
    label: 'Assignments',
    shortLabel: 'Assign',
    icon: ClipboardList,
    roles: ['REFEREE'],
  },
  
  // Scout
  {
    id: 'scouting',
    href: '/dashboard/scouting',
    label: 'Scouting',
    shortLabel: 'Scout',
    icon: Search,
    roles: ['SCOUT'],
  },
  
  // Medical
  {
    id: 'medical',
    href: '/dashboard/medical',
    label: 'Medical',
    shortLabel: 'Medical',
    icon: Heart,
    roles: ['MEDICAL_STAFF'],
  },
  
  // Media
  {
    id: 'media',
    href: '/dashboard/media',
    label: 'Media',
    shortLabel: 'Media',
    icon: Video,
    roles: ['MEDIA_MANAGER', 'COACH_PRO', 'ANALYST'],
  },
  
  // Parent/Guardian
  {
    id: 'children',
    href: '/dashboard/children',
    label: 'My Children',
    shortLabel: 'Kids',
    icon: Users,
    roles: ['PARENT', 'GUARDIAN'],
  },
  
  // Jobs
  {
    id: 'jobs',
    href: '/dashboard/jobs',
    label: 'Job Board',
    shortLabel: 'Jobs',
    icon: Briefcase,
    roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO', 'REFEREE', 'ANALYST', 'SCOUT', 'MEDICAL_STAFF'],
  },
  
  // Admin
  {
    id: 'admin',
    href: '/admin',
    label: 'Admin Panel',
    shortLabel: 'Admin',
    icon: Shield,
    roles: ['ADMIN', 'SUPERADMIN'],
  },
  
  // Settings (All)
  {
    id: 'profile',
    href: '/dashboard/profile',
    label: 'Profile',
    shortLabel: 'Profile',
    icon: User,
    roles: 'all',
  },
  {
    id: 'settings',
    href: '/dashboard/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: Settings,
    roles: 'all',
  },
];

// Bottom nav items (max 5 for mobile)
const BOTTOM_NAV_PRIORITY = ['overview', 'matches', 'calendar', 'team', 'profile'];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function filterNavItems(
  items: NavItem[],
  userRole: UserRole,
  isPro: boolean
): NavItem[] {
  return items.filter((item) => {
    // Check role access
    const hasRoleAccess =
      item.roles === 'all' || item.roles.includes(userRole);
    
    // Check pro requirement
    const meetsPro = !item.requiresPro || isPro;
    
    return hasRoleAccess && meetsPro;
  });
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MobileNav({
  userRole,
  isPro = false,
  notificationCount = 0,
  messageCount = 0,
  logo,
  appName = 'PitchConnect',
  className,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const pathname = usePathname();

  // Filter nav items based on role
  const filteredItems = useMemo(
    () => filterNavItems(NAV_ITEMS, userRole, isPro),
    [userRole, isPro]
  );

  // Get bottom nav items (max 5)
  const bottomNavItems = useMemo(() => {
    const priorityItems = BOTTOM_NAV_PRIORITY
      .map((id) => filteredItems.find((item) => item.id === id))
      .filter(Boolean) as NavItem[];
    
    // Fill remaining slots with other filtered items
    const remaining = filteredItems.filter(
      (item) => !BOTTOM_NAV_PRIORITY.includes(item.id)
    );
    
    return [...priorityItems, ...remaining].slice(0, 5);
  }, [filteredItems]);

  // Check if path is active
  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname]
  );

  // Close menu
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // =========================================================================
  // MOBILE: Hamburger Menu
  // =========================================================================
  if (isMobile) {
    return (
      <>
        {/* Header */}
        <header className={cn(
          'sticky top-0 z-40 bg-white dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700',
          'flex items-center justify-between px-4 h-16',
          className
        )}>
          <div className="flex items-center gap-3">
            {logo || (
              <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
            )}
            <h1 className="text-lg font-bold text-charcoal-900 dark:text-white">
              {appName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg"
            >
              <Bell className="w-5 h-5 text-charcoal-600 dark:text-charcoal-400" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>

            {/* Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-charcoal-700 rounded-lg"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-charcoal-700 dark:text-charcoal-300" />
              ) : (
                <Menu className="w-6 h-6 text-charcoal-700 dark:text-charcoal-300" />
              )}
            </button>
          </div>
        </header>

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={handleClose}
          />
        )}

        {/* Drawer */}
        <nav
          className={cn(
            'fixed left-0 top-16 bottom-0 w-72 bg-white dark:bg-charcoal-800 shadow-xl z-40',
            'transform transition-transform duration-300 ease-in-out overflow-y-auto',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="p-4 space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={handleClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]',
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {item.requiresPro && (
                    <Badge variant="secondary" className="text-xs bg-gradient-to-r from-gold-500 to-orange-500 text-white">
                      PRO
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  // =========================================================================
  // TABLET: Bottom Navigation
  // =========================================================================
  if (isTablet) {
    return (
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-charcoal-800',
        'border-t border-neutral-200 dark:border-charcoal-700',
        'flex items-center justify-around px-2 h-20 safe-area-pb',
        className
      )}>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                'min-w-[64px] min-h-[44px]',
                active
                  ? 'text-primary'
                  : 'text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.id === 'notifications' && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">
                {item.shortLabel || item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // =========================================================================
  // DESKTOP: Sidebar Navigation
  // =========================================================================
  return (
    <aside className={cn(
      'w-64 bg-white dark:bg-charcoal-800 border-r border-neutral-200 dark:border-charcoal-700',
      'flex flex-col h-screen sticky top-0',
      className
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-neutral-200 dark:border-charcoal-700">
        <div className="flex items-center gap-3">
          {logo || (
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">PC</span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-charcoal-900 dark:text-white">
              {appName}
            </h1>
            <Badge variant="outline" className="text-xs mt-0.5">
              {userRole.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-neutral-100 dark:hover:bg-charcoal-700'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200 dark:border-charcoal-700">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-charcoal-700 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal-900 dark:text-white truncate">
              My Profile
            </p>
            {isPro && (
              <Badge className="text-[10px] bg-gradient-to-r from-gold-500 to-orange-500 text-white">
                PRO
              </Badge>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}

MobileNav.displayName = 'MobileNav';

export default MobileNav;
