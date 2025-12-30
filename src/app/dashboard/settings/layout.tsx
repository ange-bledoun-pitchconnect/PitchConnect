/**
 * Settings Layout - ENTERPRISE EDITION
 * Path: /dashboard/settings/layout.tsx
 *
 * ============================================================================
 * FEATURES
 * ============================================================================
 * ✅ Comprehensive navigation for all settings pages
 * ✅ Role-based navigation (shows Organisation for admins)
 * ✅ Back to Dashboard functionality
 * ✅ Active state indicators
 * ✅ Mobile-responsive sidebar/tabs
 * ✅ Dark mode support
 * ✅ Accessibility compliance (WCAG 2.1 AA)
 * ✅ Smooth animations and transitions
 * ✅ Collapsible mobile menu
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  CreditCard,
  Settings,
  Users,
  Palette,
  Building2,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  isSuperAdmin?: boolean;
  roles?: Array<
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
    | 'ANALYST'
  >;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description: string;
  adminOnly?: boolean;
}

interface SettingsLayoutProps {
  children: ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SETTINGS_NAV: NavItem[] = [
  {
    href: '/dashboard/settings',
    label: 'Overview',
    icon: Settings,
    description: 'Settings overview and quick actions',
  },
  {
    href: '/dashboard/settings/profile',
    label: 'Profile',
    icon: User,
    description: 'Personal information and role settings',
  },
  {
    href: '/dashboard/settings/preferences',
    label: 'Preferences',
    icon: Palette,
    description: 'Display, theme, and language',
  },
  {
    href: '/dashboard/settings/notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Notification channels and alerts',
  },
  {
    href: '/dashboard/settings/security',
    label: 'Security',
    icon: Lock,
    description: 'Password, 2FA, and sessions',
  },
  {
    href: '/dashboard/settings/teams',
    label: 'Clubs & Teams',
    icon: Users,
    description: 'Manage club and team memberships',
  },
  {
    href: '/dashboard/settings/account',
    label: 'Account',
    icon: User,
    description: 'Account data and management',
  },
  {
    href: '/dashboard/settings/billing',
    label: 'Billing',
    icon: CreditCard,
    description: 'Subscription and payments',
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    href: '/dashboard/settings/organisation',
    label: 'Organisation',
    icon: Building2,
    description: 'Organisation settings and management',
    adminOnly: true,
  },
];

// Admin roles that can see organisation settings
const ADMIN_ROLES = ['SUPERADMIN', 'CLUB_OWNER', 'CLUB_MANAGER', 'LEAGUE_ADMIN'];

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Navigation Item Component
 */
interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

const NavItemComponent = ({ item, isActive, onClick }: NavItemComponentProps) => {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-gold-500/10 to-orange-500/10 dark:from-gold-500/20 dark:to-orange-500/20 text-gold-700 dark:text-gold-400 border-l-4 border-gold-500 dark:border-gold-400 shadow-sm'
          : 'text-charcoal-600 dark:text-charcoal-400 hover:bg-neutral-100 dark:hover:bg-charcoal-700/50 hover:text-charcoal-900 dark:hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 transition-colors ${
          isActive
            ? 'text-gold-600 dark:text-gold-400'
            : 'text-charcoal-500 dark:text-charcoal-500 group-hover:text-charcoal-700 dark:group-hover:text-charcoal-300'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold text-sm truncate ${
            isActive ? 'text-gold-700 dark:text-gold-400' : ''
          }`}
        >
          {item.label}
        </p>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-500 truncate hidden lg:block">
          {item.description}
        </p>
      </div>
      <ChevronRight
        className={`w-4 h-4 flex-shrink-0 transition-transform ${
          isActive
            ? 'text-gold-500 dark:text-gold-400'
            : 'text-charcoal-400 dark:text-charcoal-600 opacity-0 group-hover:opacity-100'
        }`}
      />
    </Link>
  );
};

/**
 * Mobile Menu Toggle
 */
interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenuToggle = ({ isOpen, onToggle }: MobileMenuProps) => {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-gold-500 to-orange-500 dark:from-gold-600 dark:to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user has admin roles
  const userRoles = (session?.user as SessionUser)?.roles || [];
  const isAdmin = useMemo(
    () => userRoles.some((role) => ADMIN_ROLES.includes(role)),
    [userRoles]
  );

  // Combine navigation items
  const navItems = useMemo(
    () => (isAdmin ? [...SETTINGS_NAV, ...ADMIN_NAV] : SETTINGS_NAV),
    [isAdmin]
  );

  // Get current page title
  const currentPage = useMemo(() => {
    const current = navItems.find((item) => item.href === pathname);
    return current?.label || 'Settings';
  }, [navItems, pathname]);

  // Close mobile menu on navigation
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-gold-50/5 to-purple-50/5 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200">
      {/* Mobile Menu Toggle */}
      <MobileMenuToggle isOpen={mobileMenuOpen} onToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-charcoal-800 hover:bg-neutral-50 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 rounded-xl border border-neutral-200 dark:border-charcoal-700 transition-all duration-200 shadow-sm hover:shadow-md mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>

          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-charcoal-900 dark:text-white">
              Settings
            </h1>
            <p className="mt-2 text-charcoal-600 dark:text-charcoal-400">
              Manage your account, preferences, and platform settings
            </p>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <nav
              className="sticky top-8 bg-white dark:bg-charcoal-800 rounded-2xl border border-neutral-200 dark:border-charcoal-700 shadow-sm overflow-hidden"
              aria-label="Settings navigation"
            >
              <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700">
                <h2 className="font-bold text-charcoal-900 dark:text-white">Settings Menu</h2>
              </div>

              <div className="p-3 space-y-1">
                {/* Main Navigation */}
                {navItems
                  .filter((item) => !item.adminOnly)
                  .map((item) => (
                    <NavItemComponent
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href}
                      onClick={handleNavClick}
                    />
                  ))}

                {/* Admin Section Divider */}
                {isAdmin && (
                  <>
                    <div className="my-4 border-t border-neutral-200 dark:border-charcoal-700" />
                    <p className="px-4 py-2 text-xs font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wider">
                      Administration
                    </p>
                    {navItems
                      .filter((item) => item.adminOnly)
                      .map((item) => (
                        <NavItemComponent
                          key={item.href}
                          item={item}
                          isActive={pathname === item.href}
                          onClick={handleNavClick}
                        />
                      ))}
                  </>
                )}
              </div>
            </nav>
          </aside>

          {/* Mobile Navigation Overlay */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <nav
                className="absolute bottom-24 right-6 w-72 bg-white dark:bg-charcoal-800 rounded-2xl border border-neutral-200 dark:border-charcoal-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
                onClick={(e) => e.stopPropagation()}
                aria-label="Settings navigation"
              >
                <div className="p-4 border-b border-neutral-200 dark:border-charcoal-700">
                  <h2 className="font-bold text-charcoal-900 dark:text-white">Settings Menu</h2>
                </div>

                <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto">
                  {navItems
                    .filter((item) => !item.adminOnly)
                    .map((item) => (
                      <NavItemComponent
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        onClick={handleNavClick}
                      />
                    ))}

                  {isAdmin && (
                    <>
                      <div className="my-4 border-t border-neutral-200 dark:border-charcoal-700" />
                      <p className="px-4 py-2 text-xs font-bold text-charcoal-500 dark:text-charcoal-500 uppercase tracking-wider">
                        Administration
                      </p>
                      {navItems
                        .filter((item) => item.adminOnly)
                        .map((item) => (
                          <NavItemComponent
                            key={item.href}
                            item={item}
                            isActive={pathname === item.href}
                            onClick={handleNavClick}
                          />
                        ))}
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-neutral-200 dark:border-charcoal-700 shadow-sm overflow-hidden">
              {/* Breadcrumb Header */}
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-charcoal-700 bg-gradient-to-r from-neutral-50 to-white dark:from-charcoal-800 dark:to-charcoal-800">
                <div className="flex items-center gap-2 text-sm">
                  <Link
                    href="/dashboard/settings"
                    className="text-charcoal-500 dark:text-charcoal-500 hover:text-charcoal-700 dark:hover:text-charcoal-300 transition-colors"
                  >
                    Settings
                  </Link>
                  {pathname !== '/dashboard/settings' && (
                    <>
                      <ChevronRight className="w-4 h-4 text-charcoal-400 dark:text-charcoal-600" />
                      <span className="font-semibold text-charcoal-900 dark:text-white">
                        {currentPage}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Page Content */}
              <div className="p-6 lg:p-8">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

SettingsLayout.displayName = 'SettingsLayout';