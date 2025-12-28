/**
 * ============================================================================
 * 🏆 PITCHCONNECT - Dashboard Layout Client Component
 * Path: src/app/dashboard/dashboard-layout-client.tsx
 * ============================================================================
 * 
 * ENTERPRISE-GRADE DASHBOARD SHELL
 * 
 * Features:
 * - Responsive sidebar navigation
 * - Role-based menu items
 * - Mobile-friendly drawer
 * - Theme support (light/dark)
 * - Real-time notifications
 * - User profile dropdown
 * 
 * Schema Alignment:
 * - UserRole: PLAYER, COACH, MANAGER, TREASURER, CLUB_OWNER, LEAGUE_ADMIN
 * - Supports all role-based routing and permissions
 * 
 * ============================================================================
 */

'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Session } from 'next-auth';
import {
  // Navigation Icons
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Trophy,
  Target,
  Wallet,
  Building2,
  Crown,
  ClipboardList,
  TrendingUp,
  Zap,
  HelpCircle,
  MessageSquare,
  CreditCard,
  // Utility Icons
  Loader2,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

type UserRole = 
  | 'PLAYER'
  | 'COACH'
  | 'MANAGER'
  | 'TREASURER'
  | 'CLUB_OWNER'
  | 'LEAGUE_ADMIN'
  | 'REFEREE'
  | 'SCOUT'
  | 'ANALYST';

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isSuperAdmin?: boolean;
  roles?: UserRole[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface DashboardLayoutClientProps {
  children: ReactNode;
  session: Session | null;
}

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

/**
 * Navigation sections with role-based visibility
 * Items without roles array are visible to all authenticated users
 */
const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: '3', badgeColor: '#ef4444' },
    ],
  },
  {
    title: 'Team Management',
    items: [
      { label: 'My Teams', href: '/dashboard/teams', icon: Users },
      { label: 'Players', href: '/dashboard/players', icon: User, roles: ['COACH', 'MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN'] },
      { label: 'Training', href: '/dashboard/training', icon: Target, roles: ['COACH', 'MANAGER', 'CLUB_OWNER'] },
      { label: 'Matches', href: '/dashboard/matches', icon: Trophy },
    ],
  },
  {
    title: 'Analytics & Insights',
    items: [
      { label: 'Performance', href: '/dashboard/analytics', icon: BarChart3, badge: 'AI', badgeColor: '#8b5cf6' },
      { label: 'Predictions', href: '/dashboard/predictions', icon: TrendingUp, badge: 'New', badgeColor: '#22c55e' },
      { label: 'Reports', href: '/dashboard/reports', icon: ClipboardList, roles: ['COACH', 'MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Club Settings', href: '/dashboard/club', icon: Building2, roles: ['MANAGER', 'CLUB_OWNER'] },
      { label: 'Finances', href: '/dashboard/finances', icon: Wallet, roles: ['TREASURER', 'MANAGER', 'CLUB_OWNER'] },
      { label: 'League Admin', href: '/dashboard/league', icon: Crown, roles: ['LEAGUE_ADMIN'] },
      { label: 'Billing', href: '/dashboard/billing', icon: CreditCard, roles: ['MANAGER', 'CLUB_OWNER', 'LEAGUE_ADMIN'] },
    ],
  },
];

/**
 * Bottom navigation items (settings, help, etc.)
 */
const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Help & Support', href: '/dashboard/support', icon: HelpCircle },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a nav item should be visible based on user roles
 */
function isNavItemVisible(item: NavItem, userRoles: UserRole[], isSuperAdmin: boolean): boolean {
  // SuperAdmin sees everything
  if (isSuperAdmin) return true;
  
  // No role restriction = visible to all
  if (!item.roles || item.roles.length === 0) return true;
  
  // Check if user has any of the required roles
  return item.roles.some(role => userRoles.includes(role));
}

/**
 * Get user initials for avatar fallback
 */
function getUserInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Get primary role display name
 */
function getPrimaryRoleName(roles: UserRole[] | undefined, isSuperAdmin: boolean): string {
  if (isSuperAdmin) return 'Super Admin';
  if (!roles || roles.length === 0) return 'Player';
  
  // Return the first (primary) role
  const roleNames: Record<UserRole, string> = {
    PLAYER: 'Player',
    COACH: 'Coach',
    MANAGER: 'Manager',
    TREASURER: 'Treasurer',
    CLUB_OWNER: 'Club Owner',
    LEAGUE_ADMIN: 'League Admin',
    REFEREE: 'Referee',
    SCOUT: 'Scout',
    ANALYST: 'Analyst',
  };
  
  return roleNames[roles[0]] || 'Player';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Sidebar Navigation Item
 */
function NavItemComponent({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-orange-500 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
      style={isActive ? { boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)' } : {}}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 font-medium text-sm">{item.label}</span>
          {item.badge && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: item.badgeColor || '#6b7280' }}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

/**
 * User Profile Dropdown
 */
function UserProfileDropdown({
  user,
  isOpen,
  onToggle,
  onClose,
}: {
  user: SessionUser;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const initials = getUserInitials(user.name);
  const roleName = getPrimaryRoleName(user.roles, user.isSuperAdmin || false);

  const handleSignOut = async () => {
    onClose();
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          {user.image ? (
            <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
            {user.name || 'User'}
          </p>
          <p className="text-xs text-gray-500">{roleName}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div 
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
            style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)' }}
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/dashboard/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              {user.isSuperAdmin && (
                <Link
                  href="/dashboard/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: '#fed7aa' }} />
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
              style={{ borderTopColor: '#f97316', borderRightColor: '#fb923c' }}
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Loading Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Preparing your workspace...</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}
    >
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Error</h1>
          <p className="text-gray-600 mt-2">
            We couldn't load your user information. Please try again.
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardLayoutClient({
  children,
  session: initialSession,
}: DashboardLayoutClientProps) {
  // ============================================================================
  // STATE & HOOKS
  // ============================================================================
  
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // UI State
  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get user from session
  const user = (session?.user || initialSession?.user) as SessionUser | undefined;
  const userRoles = user?.roles || [];
  const isSuperAdmin = user?.isSuperAdmin || false;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Hydration safety
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auth redirect
  useEffect(() => {
    if (isClient && status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, isClient, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close profile dropdown on outside click
  const handleCloseProfileDropdown = useCallback(() => {
    setProfileDropdownOpen(false);
  }, []);

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  // Loading
  if (status === 'loading' || !isClient) {
    return <LoadingState />;
  }

  // Error - no user data
  if (status === 'authenticated' && !user) {
    return <ErrorState onRetry={() => router.refresh()} />;
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
              >
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg">PitchConnect</span>
            </Link>
          )}
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {NAV_SECTIONS.map((section) => {
            // Filter items based on user roles
            const visibleItems = section.items.filter(item => 
              isNavItemVisible(item, userRoles, isSuperAdmin)
            );
            
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavItemComponent
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href || pathname?.startsWith(item.href + '/')}
                      collapsed={sidebarCollapsed}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={sidebarCollapsed}
            />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>

              {/* Search */}
              <div className="hidden sm:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span 
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#ef4444' }}
                />
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-200 mx-2" />

              {/* User Profile */}
              {user && (
                <UserProfileDropdown
                  user={user}
                  isOpen={profileDropdownOpen}
                  onToggle={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  onClose={handleCloseProfileDropdown}
                />
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}