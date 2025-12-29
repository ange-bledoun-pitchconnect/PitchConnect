// =============================================================================
// 🏆 PITCHCONNECT - MAIN DASHBOARD LAYOUT v3.0 (Enterprise Edition)
// =============================================================================
// Path: /dashboard/layout.tsx
// 
// FEATURES:
// ✅ Role-based sidebar navigation
// ✅ Dynamic header with user controls
// ✅ TeamFilterProvider context integration
// ✅ SuperAdmin special handling
// ✅ Dark mode support with system preference
// ✅ Loading and authentication states
// ✅ Mobile-responsive design
// ✅ Schema-aligned User roles
// ✅ Following capability for all users (Fan functionality)
// =============================================================================

'use client';

import { ReactNode, useEffect, useState, useCallback, createContext, useContext } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Shield,
  Briefcase,
  Trophy,
  ClipboardList,
  Target,
  BarChart3,
  Building2,
  Heart,
  UserCircle,
  Clock,
  DollarSign,
  FileText,
  Whistle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';

// =============================================================================
// TYPES - SCHEMA-ALIGNED
// =============================================================================

type UserRole =
  | 'SUPERADMIN'
  | 'PLAYER'
  | 'PLAYER_PRO'
  | 'COACH'
  | 'CLUB_MANAGER'
  | 'CLUB_OWNER'
  | 'LEAGUE_ADMIN'
  | 'PARENT'
  | 'TREASURER'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  isSuperAdmin: boolean;
  roles: UserRole[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

interface DashboardLayoutProps {
  children: ReactNode;
}

// =============================================================================
// TEAM FILTER CONTEXT
// =============================================================================

interface TeamFilterContextType {
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  selectedClubId: string | null;
  setSelectedClubId: (id: string | null) => void;
}

const TeamFilterContext = createContext<TeamFilterContextType>({
  selectedTeamId: null,
  setSelectedTeamId: () => {},
  selectedClubId: null,
  setSelectedClubId: () => {},
});

export const useTeamFilter = () => useContext(TeamFilterContext);

const TeamFilterProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  return (
    <TeamFilterContext.Provider value={{ selectedTeamId, setSelectedTeamId, selectedClubId, setSelectedClubId }}>
      {children}
    </TeamFilterContext.Provider>
  );
};

// =============================================================================
// NAVIGATION CONFIGURATION - Role-Based
// =============================================================================

const getNavItemsForRole = (roles: UserRole[], isSuperAdmin: boolean): NavItem[] => {
  const items: NavItem[] = [];

  // Everyone gets Dashboard
  items.push({ label: 'Dashboard', href: '/dashboard', icon: Home });

  // SuperAdmin routes
  if (isSuperAdmin) {
    items.push({
      label: 'Admin',
      href: '/dashboard/superadmin',
      icon: Shield,
      children: [
        { label: 'Overview', href: '/dashboard/superadmin', icon: BarChart3 },
        { label: 'Users', href: '/dashboard/superadmin/users', icon: Users },
        { label: 'Clubs', href: '/dashboard/superadmin/clubs', icon: Building2 },
        { label: 'System', href: '/dashboard/superadmin/system', icon: Settings },
      ],
    });
  }

  // Player routes
  if (roles.includes('PLAYER') || roles.includes('PLAYER_PRO')) {
    items.push({
      label: 'My Profile',
      href: '/dashboard/player',
      icon: UserCircle,
      children: [
        { label: 'Overview', href: '/dashboard/player', icon: Home },
        { label: 'Stats', href: '/dashboard/player/stats', icon: BarChart3 },
        { label: 'Matches', href: '/dashboard/player/matches', icon: Trophy },
        { label: 'Training', href: '/dashboard/player/training', icon: Target },
        { label: 'Career', href: '/dashboard/player/career', icon: Briefcase },
      ],
    });
  }

  // Coach routes
  if (roles.includes('COACH')) {
    items.push({
      label: 'Coaching',
      href: '/dashboard/coach',
      icon: Whistle,
      children: [
        { label: 'Overview', href: '/dashboard/coach', icon: Home },
        { label: 'Squad', href: '/dashboard/coach/team', icon: Users },
        { label: 'Matches', href: '/dashboard/coach/matches', icon: Trophy },
        { label: 'Training', href: '/dashboard/coach/training', icon: ClipboardList },
        { label: 'Tactics', href: '/dashboard/coach/tactics', icon: Target },
        { label: 'Timesheets', href: '/dashboard/coach/timesheets', icon: Clock },
      ],
    });
  }

  // Club Manager/Owner routes
  if (roles.includes('CLUB_MANAGER') || roles.includes('CLUB_OWNER')) {
    items.push({
      label: 'Club',
      href: '/dashboard/club',
      icon: Building2,
      children: [
        { label: 'Overview', href: '/dashboard/club', icon: Home },
        { label: 'Teams', href: '/dashboard/club/teams', icon: Users },
        { label: 'Members', href: '/dashboard/club/members', icon: UserCircle },
        { label: 'Finances', href: '/dashboard/club/finances', icon: DollarSign },
        { label: 'Analytics', href: '/dashboard/club/analytics', icon: BarChart3 },
        { label: 'Jobs', href: '/dashboard/club/jobs', icon: Briefcase },
      ],
    });
  }

  // Parent routes
  if (roles.includes('PARENT')) {
    items.push({
      label: 'My Children',
      href: '/dashboard/parent',
      icon: Heart,
      children: [
        { label: 'Overview', href: '/dashboard/parent', icon: Home },
        { label: 'Children', href: '/dashboard/parent/children', icon: Users },
        { label: 'Schedule', href: '/dashboard/parent/schedule', icon: Calendar },
        { label: 'Payments', href: '/dashboard/parent/payments', icon: DollarSign },
      ],
    });
  }

  // Treasurer routes
  if (roles.includes('TREASURER')) {
    items.push({
      label: 'Finance',
      href: '/dashboard/treasurer',
      icon: DollarSign,
      children: [
        { label: 'Overview', href: '/dashboard/treasurer', icon: Home },
        { label: 'Invoices', href: '/dashboard/treasurer/invoices', icon: FileText },
        { label: 'Payments', href: '/dashboard/treasurer/payments', icon: DollarSign },
        { label: 'Reports', href: '/dashboard/treasurer/reports', icon: BarChart3 },
      ],
    });
  }

  // Scout routes
  if (roles.includes('SCOUT')) {
    items.push({
      label: 'Scouting',
      href: '/dashboard/scout',
      icon: Search,
      children: [
        { label: 'Overview', href: '/dashboard/scout', icon: Home },
        { label: 'Players', href: '/dashboard/scout/players', icon: Users },
        { label: 'Reports', href: '/dashboard/scout/reports', icon: FileText },
        { label: 'Watchlist', href: '/dashboard/scout/watchlist', icon: Heart },
      ],
    });
  }

  // Analyst routes
  if (roles.includes('ANALYST')) {
    items.push({
      label: 'Analytics',
      href: '/dashboard/analyst',
      icon: BarChart3,
      children: [
        { label: 'Overview', href: '/dashboard/analyst', icon: Home },
        { label: 'Match Analysis', href: '/dashboard/analyst/matches', icon: Trophy },
        { label: 'Player Stats', href: '/dashboard/analyst/players', icon: Users },
        { label: 'Reports', href: '/dashboard/analyst/reports', icon: FileText },
      ],
    });
  }

  // League Admin routes
  if (roles.includes('LEAGUE_ADMIN')) {
    items.push({
      label: 'League',
      href: '/dashboard/league',
      icon: Trophy,
      children: [
        { label: 'Overview', href: '/dashboard/league', icon: Home },
        { label: 'Competitions', href: '/dashboard/league/competitions', icon: Trophy },
        { label: 'Teams', href: '/dashboard/league/teams', icon: Users },
        { label: 'Fixtures', href: '/dashboard/league/fixtures', icon: Calendar },
      ],
    });
  }

  // Referee routes
  if (roles.includes('REFEREE')) {
    items.push({
      label: 'Officiating',
      href: '/dashboard/referee',
      icon: Whistle,
      children: [
        { label: 'Overview', href: '/dashboard/referee', icon: Home },
        { label: 'Assignments', href: '/dashboard/referee/assignments', icon: Calendar },
        { label: 'Reports', href: '/dashboard/referee/reports', icon: FileText },
      ],
    });
  }

  // Universal items for everyone - Following (Fan functionality built into all users)
  items.push({
    label: 'Following',
    href: '/dashboard/following',
    icon: Heart,
    children: [
      { label: 'Feed', href: '/dashboard/following', icon: Home },
      { label: 'Teams', href: '/dashboard/following/teams', icon: Users },
      { label: 'Players', href: '/dashboard/following/players', icon: UserCircle },
      { label: 'Matches', href: '/dashboard/following/matches', icon: Trophy },
    ],
  });

  // Jobs Board - Available to all
  items.push({ label: 'Jobs', href: '/dashboard/jobs', icon: Briefcase });

  // Calendar - Available to all
  items.push({ label: 'Calendar', href: '/dashboard/calendar', icon: Calendar });

  return items;
};

// =============================================================================
// LOADING MESSAGES
// =============================================================================

const LOADING_MESSAGES = [
  'Loading your dashboard...',
  'Fetching team data...',
  'Preparing your workspace...',
  'Syncing your profile...',
];

// =============================================================================
// THEME HOOK
// =============================================================================

type Theme = 'light' | 'dark' | 'system';

const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);
    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [theme]);

  useEffect(() => {
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  const setThemeAndStore = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  return { theme, setTheme: setThemeAndStore, resolvedTheme };
};

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

const Sidebar = ({
  navItems,
  isOpen,
  onClose,
  pathname,
}: {
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">PitchConnect</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.has(item.label);
            const itemActive = isActive(item.href);

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      itemActive
                        ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      itemActive
                        ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}

                {/* Children */}
                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                    {item.children!.map(child => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child.href);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            childActive
                              ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <ChildIcon className="w-4 h-4" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

// =============================================================================
// HEADER COMPONENT
// =============================================================================

const Header = ({
  user,
  onMenuToggle,
  theme,
  setTheme,
}: {
  user: SessionUser;
  onMenuToggle: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="hidden sm:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'light' ? <Sun className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>
          {showThemeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                {(['light', 'dark', 'system'] as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === t ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-600' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                </div>
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  No new notifications
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-500 to-orange-500 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <Image src={user.avatar} alt="" width={36} height={36} className="object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">
                  {user.firstName?.[0] || user.name?.[0] || 'U'}
                </span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.firstName || user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.roles[0] || 'Member'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <UserCircle className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// =============================================================================
// MAIN LAYOUT COMPONENT
// =============================================================================

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Hydration safety
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Loading message animation
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Auth redirect
  useEffect(() => {
    if (!isClient) return;
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router, isClient]);

  // Extract user data
  const user = session?.user as SessionUser | undefined;
  const isSuperAdmin = user?.isSuperAdmin === true;
  const navItems = user ? getNavItemsForRole(user.roles || [], isSuperAdmin) : [];

  // Settings page check
  const isSettingsPage = pathname?.startsWith('/dashboard/settings');

  // Loading state
  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gold-200 dark:border-gold-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-500 border-r-gold-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-gold-500 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">PitchConnect</h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">{LOADING_MESSAGES[loadingMessageIndex]}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'authenticated' && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center space-y-4 max-w-md p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Session Error</h1>
          <p className="text-slate-600 dark:text-slate-400">We couldn&apos;t load your user information.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <TeamFilterProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            navItems={navItems}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            pathname={pathname || ''}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header
              user={user!}
              onMenuToggle={() => setSidebarOpen(true)}
              theme={theme}
              setTheme={setTheme}
            />

            {/* Page Content */}
            <main className="flex-1 overflow-auto">
              {isSettingsPage && (
                <div className="px-4 sm:px-6 lg:px-8 pt-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Link>
                </div>
              )}
              <div className="p-4 sm:p-6 lg:p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </TeamFilterProvider>
  );
}