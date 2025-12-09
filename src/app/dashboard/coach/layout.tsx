'use client';

/**
 * Dashboard Layout Component
 * Path: /dashboard/layout.tsx
 * 
 * Core Features:
 * - Responsive sidebar navigation with role-based menus
 * - Dynamic header with user controls
 * - TeamFilterProvider context integration
 * - SuperAdmin special handling
 * - Settings page navigation
 * - Dark mode support
 * - Loading and authentication states
 * 
 * Schema Aligned: User roles (SUPERADMIN, COACH, CLUB_MANAGER, LEAGUE_ADMIN, PLAYER, etc.)
 * Prisma Models: User, Role, Team, Club
 * 
 * Architecture:
 * - Uses NextAuth session management
 * - Sidebar component manages its own role-based menu (no props passed)
 * - Proper client/server boundary
 * - Hydration-safe rendering
 */

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TeamFilterProvider } from '@/lib/dashboard/team-context';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES - Schema Aligned
// ============================================================================

interface DashboardLayoutProps {
  children: ReactNode;
}

interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isSuperAdmin: boolean;
  roles: Array<
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

// ============================================================================
// CONSTANTS
// ============================================================================

const LOADING_MESSAGES = [
  'Loading your dashboard...',
  'Fetching team data...',
  'Preparing your workspace...',
  'Syncing your profile...',
];

const SUPERADMIN_ROUTE_PREFIXES = ['/dashboard/superadmin', '/dashboard/admin'];
const SETTINGS_ROUTE_PREFIXES = ['/dashboard/settings'];
const EXCLUDED_SIDEBAR_ROUTES = ['/dashboard/auth', '/dashboard/error'];

// ============================================================================
// COMPONENT
// ============================================================================

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // ============================================================================
  // HOOKS & STATE
  // ============================================================================

  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Client-side state for hydration safety
  const [isClient, setIsClient] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // ============================================================================
  // LIFECYCLE - Hydration & Authentication
  // ============================================================================

  /**
   * Mark component as client-side to prevent hydration mismatch
   */
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Cycle through loading messages for better perceived performance
   */
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  /**
   * Handle authentication redirects
   * Only runs on client-side after hydration to prevent race conditions
   */
  useEffect(() => {
    if (!isClient) return;

    if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, router, isClient]);

  // ============================================================================
  // PAGE ROUTING LOGIC - Determine Layout Type
  // ============================================================================

  // Extract user data from session (schema-aligned)
  const user = session?.user as SessionUser | undefined;
  const isSuperAdmin = user?.isSuperAdmin === true;

  // Helper functions to check current route
  const isSuperAdminRoute = SUPERADMIN_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );
  const isSettingsPage = SETTINGS_ROUTE_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );
  const shouldShowSidebar =
    isClient &&
    !EXCLUDED_SIDEBAR_ROUTES.some((route) => pathname?.startsWith(route)) &&
    !(isSuperAdmin && isSuperAdminRoute);

  // ============================================================================
  // LOADING STATE - Enhanced with animations
  // ============================================================================

  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-blue-50 to-neutral-100 dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900 transition-colors duration-200">
        <div className="text-center space-y-6">
          {/* Animated spinner */}
          <div className="flex justify-center">
            <div className="relative w-16 h-16">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gold-200 dark:border-gold-800" />
              {/* Spinning loader */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-500 border-r-gold-400 dark:border-t-gold-400 dark:border-r-gold-300 animate-spin" />
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-gold-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Loading message with animation */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-charcoal-900 dark:text-white">
              PitchConnect
            </h2>
            <p className="text-charcoal-600 dark:text-charcoal-400 font-medium min-h-6 text-lg">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>
            <div className="flex justify-center gap-1 pt-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gold-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-charcoal-500 dark:text-charcoal-500">
            Professional Sports Management Platform
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE - User not found
  // ============================================================================

  if (status === 'authenticated' && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 dark:text-white">
            Session Error
          </h1>
          <p className="text-charcoal-600 dark:text-charcoal-400">
            We couldn&apos;t load your user information. Please try logging in again.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-4 px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // SUPERADMIN LAYOUT (Minimal - SuperAdmin routes only)
  // ============================================================================

  if (isSuperAdmin && isSuperAdminRoute) {
    return (
      <TeamFilterProvider>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 transition-colors duration-200">
          {children}
        </div>
      </TeamFilterProvider>
    );
  }

  // ============================================================================
  // STANDARD LAYOUT (All other dashboard routes)
  // ============================================================================

  return (
    <TeamFilterProvider>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-charcoal-900 dark:to-charcoal-800 transition-colors duration-200">
        {/* Main Layout Container */}
        <div className="flex h-screen overflow-hidden">
          {/* SIDEBAR PANEL - Role-based navigation */}
          {shouldShowSidebar && (
            <nav
              className="hidden lg:flex lg:flex-col flex-shrink-0 bg-white dark:bg-charcoal-800 border-r border-neutral-200 dark:border-charcoal-700 transition-colors duration-200"
              aria-label="Main navigation"
            >
              {/* ✅ NO userType PROP - Sidebar gets user from useSession() internally */}
              <DashboardSidebar />
            </nav>
          )}

          {/* MAIN CONTENT AREA - Flexed */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* HEADER - Sticky with controls */}
            <header
              className="bg-white dark:bg-charcoal-800 border-b border-neutral-200 dark:border-charcoal-700 shadow-sm sticky top-0 z-40 transition-colors duration-200"
              role="banner"
            >
              <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                {/* Left Section: Back button + Title */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Back Button (Settings Pages Only) */}
                  {isSettingsPage && (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-charcoal-100 dark:bg-charcoal-700 hover:bg-charcoal-200 dark:hover:bg-charcoal-600 text-charcoal-700 dark:text-charcoal-300 rounded-lg transition-colors duration-200 font-medium text-sm flex-shrink-0"
                      aria-label="Back to Dashboard"
                      title="Back to Dashboard"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Back</span>
                    </Link>
                  )}

                  {/* Page Title */}
                  <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 dark:text-white truncate">
                    {isSettingsPage
                      ? 'Settings'
                      : `Welcome, ${user?.name?.split(' ')[0] || 'Coach'}`}
                  </h1>
                </div>

                {/* Right Section: Header Controls (User menu, notifications, etc.) */}
                <div className="flex-shrink-0">
                  <DashboardHeader />
                </div>
              </div>
            </header>

            {/* PAGE CONTENT - Main scrollable area */}
            <main
              className="flex-1 overflow-auto scroll-smooth"
              role="main"
            >
              {/* Content Wrapper with consistent padding */}
              <div className="h-full">
                <div className="p-4 sm:p-6 lg:p-8 max-w-full">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </TeamFilterProvider>
  );
}

// ============================================================================
// METADATA
// ============================================================================

DashboardLayout.displayName = 'DashboardLayout';
