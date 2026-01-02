/**
 * ============================================================================
 * NAVBAR COMPONENT - PitchConnect v7.10.1
 * ============================================================================
 * 
 * Enterprise-grade navigation with role-based access control.
 * Implements SaaS UX best practices for complex multi-role applications.
 * 
 * ARCHITECTURE:
 * - Base navigation (available to all authenticated users)
 * - Role-specific additions (progressive disclosure)
 * - Context-aware highlighting
 * - Responsive (mobile hamburger, tablet bottom nav, desktop sidebar)
 * 
 * FEATURES:
 * - 19 role support with permission-based navigation
 * - Sport context integration
 * - Team/club switching
 * - Notification badges
 * - Search integration
 * - Profile dropdown with role indicator
 * - Dark mode support
 * - Accessibility (ARIA, keyboard nav)
 * 
 * BASED ON:
 * - PlayHQ navigation patterns
 * - SAP Sports One role-based UI
 * - Toptal SaaS UX best practices
 * 
 * @version 2.0.0
 * @path src/components/sections/Navbar.tsx
 * 
 * ============================================================================
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu,
  X,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Bell,
  Search,
  Shield,
  Heart,
  Briefcase,
  FileText,
  DollarSign,
  Eye,
  Video,
  MapPin,
  UserPlus,
  Building2,
  Layers,
  Whistle,
  Activity,
  Home,
  HelpCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type UserRole } from '@/config/user-roles-config';
import { useTheme } from '@/components/providers/ThemeProvider';

// =============================================================================
// TYPES
// =============================================================================

export interface NavItem {
  /** Unique key */
  key: string;
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Icon component */
  icon: React.ElementType;
  /** Required roles (empty = all authenticated) */
  roles?: UserRole[];
  /** Badge count (e.g., notifications) */
  badge?: number;
  /** Whether this is a base item (shown to all) */
  isBase?: boolean;
  /** Sub-items for dropdown */
  children?: Omit<NavItem, 'children'>[];
  /** Whether to hide on mobile */
  hideOnMobile?: boolean;
}

export interface NavbarProps {
  /** User's notification count */
  notificationCount?: number;
  /** Current sport context */
  currentSport?: string;
  /** Current team/club name */
  currentTeam?: string;
  /** Custom logo URL */
  logoUrl?: string;
  /** Show search bar */
  showSearch?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// NAVIGATION CONFIGURATION
// =============================================================================

/**
 * Base navigation items - available to all authenticated users
 */
const BASE_NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    isBase: true,
  },
  {
    key: 'calendar',
    label: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
    isBase: true,
  },
  {
    key: 'matches',
    label: 'Matches',
    href: '/dashboard/matches',
    icon: Trophy,
    isBase: true,
  },
];

/**
 * Role-specific navigation items
 * These are added based on the user's roles
 */
const ROLE_NAV_ITEMS: NavItem[] = [
  // Player-specific
  {
    key: 'my-stats',
    label: 'My Stats',
    href: '/dashboard/player/stats',
    icon: BarChart3,
    roles: ['PLAYER', 'PLAYER_PRO'],
  },
  {
    key: 'my-training',
    label: 'Training',
    href: '/dashboard/training',
    icon: Activity,
    roles: ['PLAYER', 'PLAYER_PRO', 'COACH', 'COACH_PRO'],
  },
  
  // Coach-specific
  {
    key: 'players',
    label: 'Players',
    href: '/dashboard/players',
    icon: Users,
    roles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'SCOUT'],
  },
  {
    key: 'teams',
    label: 'Teams',
    href: '/dashboard/teams',
    icon: Shield,
    roles: ['COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
  },
  {
    key: 'tactics',
    label: 'Tactics',
    href: '/dashboard/tactics',
    icon: Layers,
    roles: ['COACH', 'COACH_PRO', 'ANALYST'],
  },
  
  // Management-specific
  {
    key: 'analytics',
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'ADMIN', 'SUPERADMIN'],
  },
  {
    key: 'medical',
    label: 'Medical',
    href: '/dashboard/medical',
    icon: Heart,
    roles: ['MEDICAL_STAFF', 'COACH', 'COACH_PRO', 'MANAGER', 'CLUB_MANAGER'],
  },
  {
    key: 'scouting',
    label: 'Scouting',
    href: '/dashboard/scouting',
    icon: Eye,
    roles: ['SCOUT', 'MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER'],
  },
  {
    key: 'finance',
    label: 'Finance',
    href: '/dashboard/finance',
    icon: DollarSign,
    roles: ['TREASURER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ADMIN', 'SUPERADMIN'],
  },
  {
    key: 'media',
    label: 'Media',
    href: '/dashboard/media',
    icon: Video,
    roles: ['MEDIA_MANAGER', 'MANAGER', 'CLUB_MANAGER', 'ADMIN', 'SUPERADMIN'],
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['MANAGER', 'CLUB_MANAGER', 'CLUB_OWNER', 'ANALYST', 'ADMIN', 'SUPERADMIN'],
  },
  
  // Referee-specific
  {
    key: 'fixtures',
    label: 'My Fixtures',
    href: '/dashboard/referee/fixtures',
    icon: Whistle,
    roles: ['REFEREE'],
  },
  
  // Parent/Guardian-specific
  {
    key: 'children',
    label: 'My Children',
    href: '/dashboard/family',
    icon: Users,
    roles: ['PARENT', 'GUARDIAN'],
  },
  
  // Admin-specific
  {
    key: 'users',
    label: 'Users',
    href: '/dashboard/admin/users',
    icon: UserPlus,
    roles: ['ADMIN', 'SUPERADMIN'],
  },
  {
    key: 'clubs',
    label: 'Clubs',
    href: '/dashboard/admin/clubs',
    icon: Building2,
    roles: ['ADMIN', 'SUPERADMIN', 'LEAGUE_ADMIN'],
  },
  {
    key: 'leagues',
    label: 'Leagues',
    href: '/dashboard/admin/leagues',
    icon: Trophy,
    roles: ['LEAGUE_ADMIN', 'ADMIN', 'SUPERADMIN'],
  },
  
  // Fan-specific (limited)
  {
    key: 'live-scores',
    label: 'Live Scores',
    href: '/live',
    icon: Activity,
    roles: ['FAN'],
  },
];

/**
 * Settings and secondary navigation
 */
const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    key: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    isBase: true,
  },
  {
    key: 'help',
    label: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
    isBase: true,
    hideOnMobile: true,
  },
];

// =============================================================================
// ROLE CONFIGURATION
// =============================================================================

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  PLAYER: { label: 'Player', color: 'bg-blue-500', icon: Users },
  PLAYER_PRO: { label: 'Pro Player', color: 'bg-blue-600', icon: Trophy },
  COACH: { label: 'Coach', color: 'bg-purple-500', icon: Whistle },
  COACH_PRO: { label: 'Pro Coach', color: 'bg-purple-600', icon: Trophy },
  MANAGER: { label: 'Manager', color: 'bg-green-500', icon: Briefcase },
  CLUB_MANAGER: { label: 'Club Manager', color: 'bg-green-600', icon: Building2 },
  CLUB_OWNER: { label: 'Club Owner', color: 'bg-amber-500', icon: Trophy },
  TREASURER: { label: 'Treasurer', color: 'bg-emerald-500', icon: DollarSign },
  REFEREE: { label: 'Referee', color: 'bg-yellow-500', icon: Whistle },
  SCOUT: { label: 'Scout', color: 'bg-cyan-500', icon: Eye },
  ANALYST: { label: 'Analyst', color: 'bg-indigo-500', icon: BarChart3 },
  PARENT: { label: 'Parent', color: 'bg-pink-500', icon: Heart },
  GUARDIAN: { label: 'Guardian', color: 'bg-pink-400', icon: Heart },
  MEDICAL_STAFF: { label: 'Medical Staff', color: 'bg-red-500', icon: Heart },
  MEDIA_MANAGER: { label: 'Media Manager', color: 'bg-violet-500', icon: Video },
  FAN: { label: 'Fan', color: 'bg-gray-500', icon: Users },
  LEAGUE_ADMIN: { label: 'League Admin', color: 'bg-orange-500', icon: Shield },
  ADMIN: { label: 'Admin', color: 'bg-red-600', icon: Shield },
  SUPERADMIN: { label: 'Super Admin', color: 'bg-red-700', icon: Shield },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getNavigationForRoles(roles: UserRole[]): NavItem[] {
  const items: NavItem[] = [...BASE_NAV_ITEMS];
  
  ROLE_NAV_ITEMS.forEach(item => {
    if (!item.roles || item.roles.some(role => roles.includes(role))) {
      // Check if item already exists
      if (!items.find(existing => existing.key === item.key)) {
        items.push(item);
      }
    }
  });
  
  return items;
}

function getPrimaryRole(roles: UserRole[]): UserRole {
  // Priority order for primary role display
  const priority: UserRole[] = [
    'SUPERADMIN', 'ADMIN', 'LEAGUE_ADMIN',
    'CLUB_OWNER', 'CLUB_MANAGER', 'MANAGER',
    'COACH_PRO', 'COACH',
    'PLAYER_PRO', 'PLAYER',
    'SCOUT', 'ANALYST', 'MEDICAL_STAFF', 'MEDIA_MANAGER', 'TREASURER', 'REFEREE',
    'PARENT', 'GUARDIAN', 'FAN',
  ];
  
  for (const role of priority) {
    if (roles.includes(role)) {
      return role;
    }
  }
  
  return roles[0] || 'PLAYER';
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  compact?: boolean;
}

function NavLink({ item, isActive, onClick, compact = false }: NavLinkProps) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-gold-500/10 text-gold-600 dark:text-gold-400 font-medium'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 hover:text-gray-900 dark:hover:text-white',
        compact && 'justify-center px-2'
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-gold-500')} />
      {!compact && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <Badge
              variant="destructive"
              className="h-5 min-w-5 px-1.5 text-xs"
            >
              {item.badge > 99 ? '99+' : item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}

interface ProfileDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  roles: UserRole[];
  onSignOut: () => void;
}

function ProfileDropdown({ user, roles, onSignOut }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const primaryRole = getPrimaryRole(roles);
  const roleConfig = ROLE_CONFIG[primaryRole];
  const RoleIcon = roleConfig.icon;
  
  const avatarUrl = user.image || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full border-2 border-gold-400 overflow-hidden flex-shrink-0">
          <Image
            src={avatarUrl}
            alt="Profile"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {user.name?.split(' ')[0] || 'User'}
          </p>
          <Badge
            className={cn(
              'text-[10px] px-1.5 py-0 h-4 text-white',
              roleConfig.color
            )}
          >
            <RoleIcon className="h-2.5 w-2.5 mr-0.5" />
            {roleConfig.label}
          </Badge>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block transition-transform group-hover:text-gray-600" />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
              {/* Multiple Roles */}
              {roles.length > 1 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {roles.slice(0, 3).map(role => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="text-[9px] px-1 py-0"
                    >
                      {ROLE_CONFIG[role].label}
                    </Badge>
                  ))}
                  {roles.length > 3 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      +{roles.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-charcoal-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/settings/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-charcoal-800"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>
            
            {/* Sign Out */}
            <div className="border-t border-gray-200 dark:border-gray-700 py-2">
              <button
                onClick={onSignOut}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function Navbar({
  notificationCount = 0,
  currentSport,
  currentTeam,
  logoUrl,
  showSearch = true,
  className,
}: NavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  // Get user roles from session
  const userRoles = useMemo(() => {
    if (!session?.user) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles = (session.user as any).roles || [(session.user as any).userType] || ['PLAYER'];
    return Array.isArray(roles) ? roles : [roles];
  }, [session?.user]);
  
  // Get navigation items based on roles
  const navItems = useMemo(() => {
    return getNavigationForRoles(userRoles as UserRole[]);
  }, [userRoles]);
  
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };
  
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };
  
  return (
    <nav
      className={cn(
        'sticky top-0 z-50 bg-white dark:bg-charcoal-950 border-b border-gray-200 dark:border-gray-800',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              ) : (
                <span className="text-2xl">⚽</span>
              )}
              <span className="text-xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent hidden sm:inline">
                PitchConnect
              </span>
            </Link>
            
            {/* Sport/Team Context */}
            {(currentSport || currentTeam) && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-charcoal-800 rounded-lg">
                {currentSport && (
                  <Badge variant="secondary" className="text-xs">
                    {currentSport}
                  </Badge>
                )}
                {currentTeam && (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {currentTeam}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.slice(0, 6).map(item => (
              <NavLink
                key={item.key}
                item={item}
                isActive={isActive(item.href)}
              />
            ))}
            
            {navItems.length > 6 && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg">
                  More
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="py-2">
                    {navItems.slice(6).map(item => (
                      <NavLink
                        key={item.key}
                        item={item}
                        isActive={isActive(item.href)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            {showSearch && (
              <button
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors hidden sm:flex"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            {session ? (
              <>
                {/* Notifications */}
                <Link
                  href="/dashboard/notifications"
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>
                
                {/* Profile Dropdown */}
                <ProfileDropdown
                  user={session.user}
                  roles={userRoles as UserRole[]}
                  onSignOut={handleSignOut}
                />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-gold-500 hover:bg-gold-600 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-200 dark:border-gray-700 mt-2 pt-4">
            {/* Mobile User Info */}
            {session?.user && (
              <div className="px-3 py-3 mb-4 bg-gray-50 dark:bg-charcoal-800 rounded-lg">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                  {session.user.email}
                </p>
                <div className="flex flex-wrap gap-1">
                  {userRoles.slice(0, 2).map(role => (
                    <Badge
                      key={role}
                      className={cn('text-[10px] text-white', ROLE_CONFIG[role as UserRole]?.color)}
                    >
                      {ROLE_CONFIG[role as UserRole]?.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mobile Nav Items */}
            <div className="space-y-1">
              {navItems.filter(item => !item.hideOnMobile).map(item => (
                <NavLink
                  key={item.key}
                  item={item}
                  isActive={isActive(item.href)}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </div>
            
            {/* Mobile Secondary Actions */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
              {SECONDARY_NAV_ITEMS.filter(item => !item.hideOnMobile).map(item => (
                <NavLink
                  key={item.key}
                  item={item}
                  isActive={isActive(item.href)}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              
              {session && (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Navbar;